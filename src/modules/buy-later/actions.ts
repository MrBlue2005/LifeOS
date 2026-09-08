"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/core/auth/session";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { canTransitionStatus } from "./domain/lifecycle";
import {
  isUuid,
  validateBuyLaterInput,
  validateNewReconsiderationDate,
} from "./domain/validation";
import type { BuyLaterActionState, BuyLaterStatus } from "./types";
import { validatePushSubscription, validateReminderTimeZone, type SerializedPushSubscription } from "./domain/push-subscription";

function actionError(
  message: string,
  values: Readonly<Record<string, string>> = {},
  fields: Readonly<Record<string, string>> = {},
): BuyLaterActionState {
  return { status: "error", message, values, fields };
}

async function getActionContext() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  return { user, supabase: await createSupabaseServerClient() };
}

function itemValues(input: {
  name: string; productUrl: string | null; currentPrice: string | null;
  currency: string | null; note: string | null; reconsiderAt: string;
}) {
  return {
    name: input.name,
    productUrl: input.productUrl ?? "",
    currentPrice: input.currentPrice ?? "",
    currency: input.currency ?? "",
    note: input.note ?? "",
    reconsiderAt: input.reconsiderAt,
  };
}

function revalidateBuyLater(itemId?: string) {
  revalidatePath("/buy-later");
  revalidatePath("/buy-later/history");
  if (itemId) revalidatePath(`/buy-later/items/${itemId}`);
}

export async function createBuyLaterItemAction(
  _state: BuyLaterActionState,
  formData: FormData,
): Promise<BuyLaterActionState> {
  const input = validateBuyLaterInput(formData);
  if (!input.success) return actionError(input.message, input.values, input.fields);
  const context = await getActionContext();
  if (!context) return actionError("Your session has expired. Sign in and try again.", itemValues(input.data));

  const { data, error } = await context.supabase.from("buy_later_items").insert({
    user_id: context.user.id,
    name: input.data.name,
    product_url: input.data.productUrl,
    current_price: input.data.currentPrice,
    currency: input.data.currency,
    note: input.data.note,
    reconsider_at: input.data.reconsiderAt,
  }).select("id").single();
  if (error) return actionError("Could not save this item. Try again.", itemValues(input.data));
  revalidateBuyLater(data.id);
  redirect(`/buy-later/items/${data.id}?notice=item-created`);
}

export async function updateBuyLaterItemAction(
  _state: BuyLaterActionState,
  formData: FormData,
): Promise<BuyLaterActionState> {
  const itemId = formData.get("itemId");
  if (typeof itemId !== "string" || !isUuid(itemId)) return actionError("Choose a valid item to update.");
  const input = validateBuyLaterInput(formData, { allowPastDate: true });
  if (!input.success) return actionError(input.message, input.values, input.fields);
  const context = await getActionContext();
  if (!context) return actionError("Your session has expired. Sign in and try again.", itemValues(input.data));

  const { data, error } = await context.supabase.from("buy_later_items").update({
    name: input.data.name,
    product_url: input.data.productUrl,
    current_price: input.data.currentPrice,
    currency: input.data.currency,
    note: input.data.note,
    reconsider_at: input.data.reconsiderAt,
  }).eq("user_id", context.user.id).eq("id", itemId).select("id").maybeSingle();
  if (error || !data) return actionError("Could not update this item.", itemValues(input.data));
  revalidateBuyLater(itemId);
  redirect(`/buy-later/items/${itemId}?notice=item-updated`);
}

export async function rescheduleBuyLaterItemAction(
  _state: BuyLaterActionState,
  formData: FormData,
): Promise<BuyLaterActionState> {
  const itemId = formData.get("itemId");
  if (typeof itemId !== "string" || !isUuid(itemId)) return actionError("Choose a valid item.");
  const input = validateNewReconsiderationDate(formData);
  if (!input.success) return actionError(input.message, input.values, input.fields);
  const context = await getActionContext();
  if (!context) return actionError("Your session has expired. Sign in and try again.");
  const { data, error } = await context.supabase.from("buy_later_items")
    .update({ reconsider_at: input.data, resolved_at: null, status: "considering" })
    .eq("user_id", context.user.id).eq("id", itemId).eq("status", "considering")
    .select("id").maybeSingle();
  if (error || !data) return actionError("Could not set the new reconsideration date.");
  revalidateBuyLater(itemId);
  redirect(`/buy-later/items/${itemId}?notice=item-rescheduled`);
}

export async function resolveBuyLaterItemAction(
  _state: BuyLaterActionState,
  formData: FormData,
): Promise<BuyLaterActionState> {
  const itemId = formData.get("itemId");
  const outcome = formData.get("outcome");
  if (typeof itemId !== "string" || !isUuid(itemId)) return actionError("Choose a valid item.");
  if (outcome !== "purchased" && outcome !== "dismissed") return actionError("Choose a valid decision.");
  if (!canTransitionStatus("considering", outcome)) return actionError("That decision is not available.");
  const context = await getActionContext();
  if (!context) return actionError("Your session has expired. Sign in and try again.");
  const status: BuyLaterStatus = outcome;
  const { data, error } = await context.supabase.from("buy_later_items")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("user_id", context.user.id).eq("id", itemId).eq("status", "considering")
    .select("id").maybeSingle();
  if (error || !data) return actionError("Could not save that decision.");
  revalidateBuyLater(itemId);
  redirect(`/buy-later/items/${itemId}?notice=item-${status}`);
}

export async function deleteBuyLaterItemAction(
  _state: BuyLaterActionState,
  formData: FormData,
): Promise<BuyLaterActionState> {
  const itemId = formData.get("itemId");
  if (typeof itemId !== "string" || !isUuid(itemId)) return actionError("Choose a valid item to delete.");
  const context = await getActionContext();
  if (!context) return actionError("Your session has expired. Sign in and try again.");
  const { data, error } = await context.supabase.from("buy_later_items").delete()
    .eq("user_id", context.user.id).eq("id", itemId).select("id").maybeSingle();
  if (error || !data) return actionError("Could not permanently delete this item.");
  revalidateBuyLater(itemId);
  redirect("/buy-later?notice=item-deleted");
}

export type ReminderActionResult = Readonly<{ ok: boolean; message?: string }>;

function reminderError(message: string): ReminderActionResult { return { ok: false, message }; }

export async function enableBuyLaterRemindersAction(input: Readonly<{
  timezone: string; includeItemName: boolean; subscription: SerializedPushSubscription;
}>): Promise<ReminderActionResult> {
  const context = await getActionContext();
  if (!context) return reminderError("Your session has expired. Sign in and try again.");
  try {
    const timezone = validateReminderTimeZone(input.timezone);
    const subscription = validatePushSubscription(input.subscription);
    const { data, error } = await context.supabase.rpc("enable_buy_later_push_reminders", {
      preference_timezone: timezone,
      preference_include_item_name: input.includeItemName,
      subscription_endpoint: subscription.endpoint,
      subscription_p256dh: subscription.p256dh,
      subscription_auth: subscription.auth,
      subscription_expiration_time: subscription.expirationTime,
    });
    if (error) return reminderError("Could not secure reminders on this device. Try again.");
    if (data !== "enabled") return reminderError("This browser subscription is already associated with another account.");
    revalidatePath("/buy-later");
    return { ok: true };
  } catch (error) {
    return reminderError(error instanceof Error ? error.message : "Could not enable reminders.");
  }
}

export async function disableBuyLaterRemindersAction(endpoint: string | null): Promise<ReminderActionResult> {
  const context = await getActionContext();
  if (!context) return reminderError("Your session has expired. Sign in and try again.");
  if (endpoint !== null) {
    try { validatePushSubscription({ endpoint, p256dh: "x", auth: "x", expirationTime: null }); }
    catch { return reminderError("This browser returned an invalid push subscription."); }
  }
  const { error } = await context.supabase.rpc("disable_buy_later_push_reminders", { subscription_endpoint: endpoint });
  if (error) return reminderError("Could not disable server reminders. Try again.");
  revalidatePath("/buy-later");
  return { ok: true };
}

export async function updateBuyLaterNotificationPrivacyAction(includeItemName: boolean): Promise<ReminderActionResult> {
  const context = await getActionContext();
  if (!context) return reminderError("Your session has expired. Sign in and try again.");
  const { error } = await context.supabase.from("buy_later_notification_preferences")
    .update({ include_item_name: includeItemName }).eq("user_id", context.user.id);
  if (error) return reminderError("Could not update notification privacy. Try again.");
  revalidatePath("/buy-later");
  return { ok: true };
}
