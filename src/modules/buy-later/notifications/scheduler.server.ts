import { getWebPushServerConfig } from "@/core/config/web-push.server";
import { sendWebPush, webPushStatusCode } from "@/core/notifications/web-push.server";
import { createSupabaseServiceClient } from "@/core/supabase/service.server";
import { createBuyLaterReminderPayload } from "./payload";

export const BUY_LATER_REMINDER_BATCH_LIMITS = {
  users: 1000,
  itemsPerUser: 3,
  pushes: 250,
} as const;

type ClaimedReminder = Readonly<{
  delivery_id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  reconsider_at: string;
  subscription_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  include_item_name: boolean;
}>;

export type BuyLaterReminderSchedulerResult = Readonly<{
  usersProcessed: number;
  itemsClaimed: number;
  pushesAttempted: number;
  pushesSent: number;
  pushesFailed: number;
  staleSubscriptionsCleaned: number;
}>;

function deliveryState(state: "sent" | "failed" | "revoked", now: string) {
  return state === "sent"
    ? { state, attempted_at: now, sent_at: now, failed_at: null, revoked_at: null }
    : state === "failed"
      ? { state, attempted_at: now, sent_at: null, failed_at: now, revoked_at: null }
      : { state, attempted_at: now, sent_at: null, failed_at: null, revoked_at: now };
}

async function setDeliveryState(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  deliveryId: string,
  state: "sent" | "failed" | "revoked",
  now: string,
) {
  const { error } = await supabase.from("buy_later_reminder_deliveries")
    .update(deliveryState(state, now)).eq("id", deliveryId);
  if (error) throw new Error("Could not record reminder delivery.");
}

export async function runBuyLaterDueReminderScheduler(input: Readonly<{ rolloutDate: string; now?: Date }>): Promise<BuyLaterReminderSchedulerResult> {
  // Validate delivery configuration before creating irreversible idempotency claims.
  const webPushConfig = getWebPushServerConfig();
  if (!webPushConfig) throw new Error("Notification delivery is not configured.");

  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("claim_buy_later_due_reminders", {
    run_at: nowIso,
    rollout_date: input.rolloutDate,
    max_users: BUY_LATER_REMINDER_BATCH_LIMITS.users,
    max_items_per_user: BUY_LATER_REMINDER_BATCH_LIMITS.itemsPerUser,
    max_pushes: BUY_LATER_REMINDER_BATCH_LIMITS.pushes,
  });
  if (error) throw new Error("Could not claim due reminders.");

  const claims = (data ?? []) as ClaimedReminder[];
  let pushesSent = 0;
  let pushesFailed = 0;
  let staleSubscriptionsCleaned = 0;

  for (const claim of claims) {
    let providerError: unknown = null;
    try {
      await sendWebPush(
        { id: claim.subscription_id, endpoint: claim.endpoint, p256dh: claim.p256dh, auth: claim.auth },
        createBuyLaterReminderPayload(claim.include_item_name, { id: claim.item_id, name: claim.item_name }),
      );
    } catch (error) {
      providerError = error;
    }

    if (providerError === null) {
      await setDeliveryState(supabase, claim.delivery_id, "sent", nowIso);
      pushesSent += 1;
    } else {
      const status = webPushStatusCode(providerError);
      if (status === 404 || status === 410) {
        const { error: subscriptionError } = await supabase.from("buy_later_push_subscriptions")
          .update({ active: false, revoked_at: nowIso })
          .eq("user_id", claim.user_id).eq("id", claim.subscription_id);
        if (subscriptionError) throw new Error("Could not revoke an expired reminder subscription.");
        await setDeliveryState(supabase, claim.delivery_id, "revoked", nowIso);
        staleSubscriptionsCleaned += 1;
      } else {
        await setDeliveryState(supabase, claim.delivery_id, "failed", nowIso);
      }
      pushesFailed += 1;
    }
  }

  return {
    usersProcessed: new Set(claims.map((claim) => claim.user_id)).size,
    itemsClaimed: new Set(claims.map((claim) => claim.item_id)).size,
    pushesAttempted: claims.length,
    pushesSent,
    pushesFailed,
    staleSubscriptionsCleaned,
  };
}
