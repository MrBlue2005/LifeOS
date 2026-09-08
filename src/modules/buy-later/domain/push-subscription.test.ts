import { describe, expect, it } from "vitest";
import { validatePushSubscription, validateReminderTimeZone, vapidPublicKeyToBytes } from "./push-subscription";

describe("Buy Later push subscription boundary", () => {
  const subscription = { endpoint: "https://push.example/subscription", p256dh: "public-key", auth: "auth-secret", expirationTime: null };

  it("converts a public URL-safe VAPID key without accepting malformed values", () => {
    expect(vapidPublicKeyToBytes("A".repeat(87))).toBeInstanceOf(ArrayBuffer);
    expect(() => vapidPublicKeyToBytes("not-a-key")).toThrow();
  });

  it("accepts bounded HTTPS subscription material and rejects unsafe endpoints", () => {
    expect(validatePushSubscription(subscription)).toEqual(subscription);
    expect(() => validatePushSubscription({ ...subscription, endpoint: "http://push.example/subscription" })).toThrow();
    expect(() => validatePushSubscription({ ...subscription, endpoint: "https://user:pass@push.example/subscription" })).toThrow();
  });

  it("uses the existing IANA timezone policy", () => {
    expect(validateReminderTimeZone("Europe/Bucharest")).toBe("Europe/Bucharest");
    expect(() => validateReminderTimeZone("Not/AZone")).toThrow();
  });
});
