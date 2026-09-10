import { timingSafeEqual } from "node:crypto";

type BuyLaterReminderSchedulerConfig = Readonly<{ secret: string; rolloutDate: string }>;

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

export function parseBuyLaterReminderSchedulerConfig(environment: Record<string, string | undefined>): BuyLaterReminderSchedulerConfig | null {
  const secret = environment.BUY_LATER_REMINDER_CRON_SECRET?.trim();
  const rolloutDate = environment.BUY_LATER_REMINDER_ROLLOUT_DATE?.trim();
  if (!secret && !rolloutDate) return null;
  if (!secret || !rolloutDate || secret.length < 32 || secret.length > 512 || /\s/.test(secret) || !isCalendarDate(rolloutDate)) {
    throw new Error("Buy Later reminder scheduler configuration is invalid.");
  }
  return { secret, rolloutDate };
}

export function getBuyLaterReminderSchedulerConfig(): BuyLaterReminderSchedulerConfig | null {
  return parseBuyLaterReminderSchedulerConfig(process.env);
}

export function isAuthorizedBuyLaterReminderSchedulerRequest(authorization: string | null, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization ?? "");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
