import { describe, expect, it } from "vitest";
import { isAuthorizedBuyLaterReminderSchedulerRequest, parseBuyLaterReminderSchedulerConfig } from "./buy-later-reminder-scheduler.server";

const secret = "A".repeat(32);

describe("Buy Later reminder scheduler configuration", () => {
  it("requires a server-only secret and a valid rollout date", () => {
    expect(parseBuyLaterReminderSchedulerConfig({})).toBeNull();
    expect(parseBuyLaterReminderSchedulerConfig({ BUY_LATER_REMINDER_CRON_SECRET: secret, BUY_LATER_REMINDER_ROLLOUT_DATE: "2026-09-15" }))
      .toEqual({ secret, rolloutDate: "2026-09-15" });
    expect(() => parseBuyLaterReminderSchedulerConfig({ BUY_LATER_REMINDER_CRON_SECRET: secret, BUY_LATER_REMINDER_ROLLOUT_DATE: "2026-02-30" })).toThrow();
    expect(() => parseBuyLaterReminderSchedulerConfig({ BUY_LATER_REMINDER_CRON_SECRET: "short", BUY_LATER_REMINDER_ROLLOUT_DATE: "2026-09-15" })).toThrow();
  });

  it("only accepts the exact bearer credential", () => {
    expect(isAuthorizedBuyLaterReminderSchedulerRequest(`Bearer ${secret}`, secret)).toBe(true);
    expect(isAuthorizedBuyLaterReminderSchedulerRequest(null, secret)).toBe(false);
    expect(isAuthorizedBuyLaterReminderSchedulerRequest(`Bearer ${"B".repeat(32)}`, secret)).toBe(false);
  });
});
