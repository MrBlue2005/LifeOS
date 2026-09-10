import { createSupabaseServiceClient } from "@/core/supabase/service.server";
import { sendWebPush, webPushStatusCode, type WebPushSubscription } from "@/core/notifications/web-push.server";
import { createBuyLaterReminderPayload } from "./payload";

const TEST_COOLDOWN_MS = 60_000;
const lastTestSendByUser = new Map<string, number>();

export type ManualPushTestResult = Readonly<{ ok: boolean; attempted: number; sent: number; message?: string }>;

export { createBuyLaterReminderPayload as createBuyLaterTestPayload } from "./payload";

function isWithinCooldown(userId: string, now: number): boolean {
  const previous = lastTestSendByUser.get(userId);
  return previous !== undefined && now - previous < TEST_COOLDOWN_MS;
}

export async function sendBuyLaterManualPushTest(input: Readonly<{ userId: string; includeItemName: boolean; now?: number }>): Promise<ManualPushTestResult> {
  const now = input.now ?? Date.now();
  if (isWithinCooldown(input.userId, now)) return { ok: false, attempted: 0, sent: 0, message: "Please wait a minute before sending another test." };
  const supabase = createSupabaseServiceClient();
  const { data: subscriptions, error } = await supabase.from("buy_later_push_subscriptions")
    .select("id,endpoint,p256dh,auth").eq("user_id", input.userId).eq("active", true);
  if (error) return { ok: false, attempted: 0, sent: 0, message: "Could not prepare a test notification." };
  if (!subscriptions.length) return { ok: false, attempted: 0, sent: 0, message: "No active reminder subscription was found." };
  lastTestSendByUser.set(input.userId, now);
  const payload = createBuyLaterReminderPayload(input.includeItemName);
  let sent = 0;
  for (const subscription of subscriptions as WebPushSubscription[]) {
    try { await sendWebPush(subscription, payload); sent += 1; }
    catch (error) {
      const status = webPushStatusCode(error);
      if (status === 404 || status === 410) {
        await supabase.from("buy_later_push_subscriptions").update({ active: false, revoked_at: new Date(now).toISOString() })
          .eq("user_id", input.userId).eq("id", subscription.id);
      }
    }
  }
  return sent ? { ok: true, attempted: subscriptions.length, sent } : { ok: false, attempted: subscriptions.length, sent: 0, message: "The test notification could not be delivered." };
}

export const manualPushTestCooldown = { clear() { lastTestSendByUser.clear(); } };
