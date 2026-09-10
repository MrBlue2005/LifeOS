import { describe, expect, it } from "vitest";
import {
  BUY_LATER_REMINDER_HOUR,
  calendarDateInTimeZone,
  defaultBuyLaterNotificationPreferences,
  hasReachedBuyLaterReminderHour,
  isEligibleForBuyLaterReminder,
  isEligibleForScheduledBuyLaterReminder,
  isValidIanaTimeZone,
} from "./reminder-policy";

describe("Buy Later reminder policy", () => {
  it("defaults to disabled push and private notification wording", () => {
    expect(defaultBuyLaterNotificationPreferences).toEqual({ pushEnabled: false, includeItemName: false });
    expect(BUY_LATER_REMINDER_HOUR).toBe(9);
  });

  it("accepts valid IANA zones and rejects invalid or unsafe values", () => {
    expect(isValidIanaTimeZone("Europe/Bucharest")).toBe(true);
    expect(isValidIanaTimeZone("UTC")).toBe(true);
    expect(isValidIanaTimeZone("Not/AZone")).toBe(false);
    expect(isValidIanaTimeZone(" Europe/Bucharest")).toBe(false);
  });

  it("uses the user's local calendar date around a UTC boundary", () => {
    const now = new Date("2026-09-14T21:30:00.000Z");
    expect(calendarDateInTimeZone("Europe/Bucharest", now)).toBe("2026-09-15");
    expect(calendarDateInTimeZone("America/Los_Angeles", now)).toBe("2026-09-14");
  });

  it("evaluates the fixed 09:00 policy in the user's local time", () => {
    expect(hasReachedBuyLaterReminderHour("Europe/Bucharest", new Date("2026-09-15T05:59:00.000Z"))).toBe(false);
    expect(hasReachedBuyLaterReminderHour("Europe/Bucharest", new Date("2026-09-15T06:00:00.000Z"))).toBe(true);
    expect(hasReachedBuyLaterReminderHour("Europe/Bucharest", new Date("2026-09-15T10:00:00.000Z"))).toBe(true);
  });

  it("only considers active due items once the local policy hour is reached", () => {
    expect(isEligibleForBuyLaterReminder({ status: "considering", reconsiderAt: "2026-09-15" }, "2026-09-15", true)).toBe(true);
    expect(isEligibleForBuyLaterReminder({ status: "considering", reconsiderAt: "2026-09-15" }, "2026-09-15", false)).toBe(false);
    expect(isEligibleForBuyLaterReminder({ status: "purchased", reconsiderAt: "2026-09-14" }, "2026-09-15", true)).toBe(false);
    expect(isEligibleForBuyLaterReminder({ status: "dismissed", reconsiderAt: "2026-09-14" }, "2026-09-15", true)).toBe(false);
  });

  it("requires enabled preferences, a valid timezone, an active subscription, and a post-rollout due date", () => {
    const now = new Date("2026-09-15T06:00:00.000Z");
    const eligible = {
      pushEnabled: true, timezone: "Europe/Bucharest", activeSubscriptionCount: 1,
      item: { status: "considering" as const, reconsiderAt: "2026-09-15" }, rolloutDate: "2026-09-15",
    };
    expect(isEligibleForScheduledBuyLaterReminder(eligible, now)).toBe(true);
    expect(isEligibleForScheduledBuyLaterReminder({ ...eligible, activeSubscriptionCount: 0 }, now)).toBe(false);
    expect(isEligibleForScheduledBuyLaterReminder({ ...eligible, pushEnabled: false }, now)).toBe(false);
    expect(isEligibleForScheduledBuyLaterReminder({ ...eligible, timezone: "Not/AZone" }, now)).toBe(false);
    expect(isEligibleForScheduledBuyLaterReminder({ ...eligible, item: { status: "considering", reconsiderAt: "2026-09-14" } }, now)).toBe(false);
    expect(isEligibleForScheduledBuyLaterReminder({ ...eligible, item: { status: "purchased", reconsiderAt: "2026-09-15" } }, now)).toBe(false);
    expect(isEligibleForScheduledBuyLaterReminder({ ...eligible, item: { status: "dismissed", reconsiderAt: "2026-09-15" } }, now)).toBe(false);
    expect(isEligibleForScheduledBuyLaterReminder({ ...eligible, item: { status: "considering", reconsiderAt: "2026-09-16" } }, now)).toBe(false);
  });

  it("keeps the 09:00 policy correct across Bucharest daylight-saving time", () => {
    expect(isEligibleForScheduledBuyLaterReminder({
      pushEnabled: true, timezone: "Europe/Bucharest", activeSubscriptionCount: 1,
      item: { status: "considering", reconsiderAt: "2026-03-29" }, rolloutDate: "2026-03-29",
    }, new Date("2026-03-29T05:59:00.000Z"))).toBe(false);
    expect(isEligibleForScheduledBuyLaterReminder({
      pushEnabled: true, timezone: "Europe/Bucharest", activeSubscriptionCount: 1,
      item: { status: "considering", reconsiderAt: "2026-03-29" }, rolloutDate: "2026-03-29",
    }, new Date("2026-03-29T06:00:00.000Z"))).toBe(true);
  });
});
