import { describe, expect, it } from "vitest";
import { parseWebPushServerConfig } from "./web-push.server";

const publicKey = "A".repeat(87);
const privateKey = "B".repeat(43);

describe("server-only Web Push configuration", () => {
  it("requires a complete server-only VAPID configuration", () => {
    expect(parseWebPushServerConfig({})).toBeNull();
    expect(() => parseWebPushServerConfig({ WEB_PUSH_VAPID_PUBLIC_KEY: publicKey })).toThrow();
    expect(parseWebPushServerConfig({ WEB_PUSH_VAPID_PUBLIC_KEY: publicKey, WEB_PUSH_VAPID_PRIVATE_KEY: privateKey, WEB_PUSH_VAPID_SUBJECT: "mailto:push@example.com" }))
      .toEqual({ publicKey, privateKey, subject: "mailto:push@example.com" });
  });

  it("rejects invalid subjects and mismatched client/server public keys", () => {
    expect(() => parseWebPushServerConfig({ WEB_PUSH_VAPID_PUBLIC_KEY: publicKey, WEB_PUSH_VAPID_PRIVATE_KEY: privateKey, WEB_PUSH_VAPID_SUBJECT: "http://unsafe.example" })).toThrow();
    expect(() => parseWebPushServerConfig({ WEB_PUSH_VAPID_PUBLIC_KEY: publicKey, WEB_PUSH_VAPID_PRIVATE_KEY: privateKey, WEB_PUSH_VAPID_SUBJECT: "mailto:push@example.com", NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: "C".repeat(87) })).toThrow();
  });

  it("accepts the 43-character private key generated for VAPID", () => {
    expect(parseWebPushServerConfig({ WEB_PUSH_VAPID_PUBLIC_KEY: publicKey, WEB_PUSH_VAPID_PRIVATE_KEY: privateKey, WEB_PUSH_VAPID_SUBJECT: "https://example.com" }))
      .toEqual({ publicKey, privateKey, subject: "https://example.com" });
    expect(() => parseWebPushServerConfig({ WEB_PUSH_VAPID_PUBLIC_KEY: publicKey, WEB_PUSH_VAPID_PRIVATE_KEY: "B".repeat(42), WEB_PUSH_VAPID_SUBJECT: "mailto:push@example.com" })).toThrow();
  });
});
