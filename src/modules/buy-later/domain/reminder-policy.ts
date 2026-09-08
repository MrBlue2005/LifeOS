import type { BuyLaterStatus } from "../types";

export const BUY_LATER_REMINDER_HOUR = 9;

export const defaultBuyLaterNotificationPreferences = {
  pushEnabled: false,
  includeItemName: false,
} as const;

function formatter(timeZone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, ...options });
}

function numberPart(now: Date, timeZone: string, type: Intl.DateTimeFormatPartTypes): number {
  const part = formatter(timeZone, { hour: "2-digit", hourCycle: "h23" })
    .formatToParts(now)
    .find((candidate) => candidate.type === type)?.value;
  return Number(part);
}

export function isValidIanaTimeZone(value: string): boolean {
  if (value !== value.trim() || value.length < 1 || value.length > 64) return false;
  try {
    formatter(value, { year: "numeric" }).format();
    return true;
  } catch {
    return false;
  }
}

export function calendarDateInTimeZone(timeZone: string, now = new Date()): string {
  if (!isValidIanaTimeZone(timeZone)) throw new Error("Choose a valid IANA timezone.");
  const parts = formatter(timeZone, { year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function hasReachedBuyLaterReminderHour(timeZone: string, now = new Date()): boolean {
  if (!isValidIanaTimeZone(timeZone)) throw new Error("Choose a valid IANA timezone.");
  return numberPart(now, timeZone, "hour") >= BUY_LATER_REMINDER_HOUR;
}

export function isEligibleForBuyLaterReminder(
  item: Readonly<{ status: BuyLaterStatus; reconsiderAt: string }>,
  localDate: string,
  hasReachedReminderHour: boolean,
): boolean {
  return item.status === "considering" && item.reconsiderAt <= localDate && hasReachedReminderHour;
}
