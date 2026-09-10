import webPush from "web-push";
import { getWebPushServerConfig } from "@/core/config/web-push.server";

export type WebPushSubscription = Readonly<{ id: string; endpoint: string; p256dh: string; auth: string }>;
export type WebPushPayload = Readonly<{ title: string; body: string; url: string }>;

export async function sendWebPush(subscription: WebPushSubscription, payload: WebPushPayload): Promise<void> {
  const config = getWebPushServerConfig();
  if (!config) throw new Error("Notification delivery is not configured.");
  await webPush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify(payload), {
    vapidDetails: { subject: config.subject, publicKey: config.publicKey, privateKey: config.privateKey },
    TTL: 60,
    urgency: "normal",
  });
}

export function webPushStatusCode(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return null;
  const value = (error as { statusCode?: unknown }).statusCode;
  return typeof value === "number" ? value : null;
}
