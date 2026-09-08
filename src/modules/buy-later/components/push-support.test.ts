import { describe, expect, it } from "vitest";
import { detectPushSupport } from "./push-support";

function browser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    isSecureContext: true,
    Notification: class Notification {},
    PushManager: class PushManager {},
    matchMedia: () => ({ matches: false }),
    navigator: { serviceWorker: {} },
    ...overrides,
  } as unknown as Parameters<typeof detectPushSupport>[0];
}

describe("Web Push support detection", () => {
  it("requires secure context, service workers, PushManager, and Notifications", () => {
    expect(detectPushSupport(browser()).supported).toBe(true);
    expect(detectPushSupport(browser({ isSecureContext: false })).supported).toBe(false);
    expect(detectPushSupport(browser({ PushManager: undefined })).supported).toBe(false);
  });

  it("recognizes standalone mode without user-agent sniffing", () => {
    expect(detectPushSupport(browser({ matchMedia: () => ({ matches: true }) })).standalone).toBe(true);
  });
});
