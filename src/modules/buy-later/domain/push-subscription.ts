import { isValidIanaTimeZone } from "./reminder-policy";

export type SerializedPushSubscription = Readonly<{
  endpoint: string;
  p256dh: string;
  auth: string;
  expirationTime: string | null;
}>;

export function vapidPublicKeyToBytes(value: string): ArrayBuffer {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9_-]{80,200}$/.test(normalized)) throw new Error("A valid public Web Push key is required.");
  const base64 = normalized.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

export function validatePushSubscription(value: SerializedPushSubscription): SerializedPushSubscription {
  let url: URL;
  try { url = new URL(value.endpoint); } catch { throw new Error("This browser returned an invalid push subscription."); }
  if (url.protocol !== "https:" || url.username || url.password || value.endpoint.length > 2048) {
    throw new Error("This browser returned an invalid push subscription.");
  }
  const p256dh = value.p256dh.trim();
  const auth = value.auth.trim();
  if (!p256dh || p256dh.length > 512 || !auth || auth.length > 256) throw new Error("This browser returned an incomplete push subscription.");
  return { endpoint: value.endpoint.trim(), p256dh, auth, expirationTime: value.expirationTime };
}

export function validateReminderTimeZone(value: string): string {
  if (!isValidIanaTimeZone(value)) throw new Error("Your browser timezone is not supported for reminders.");
  return value;
}
