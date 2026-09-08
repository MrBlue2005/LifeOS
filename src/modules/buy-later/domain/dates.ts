import type { BuyLaterItem } from "../types";

export function todayDateString(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

export function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function addMonth(value: string): string {
  const source = new Date(`${value}T00:00:00.000Z`);
  const day = source.getUTCDate();
  const target = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + 1, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export function reconsiderationPresets(today: string) {
  return [
    { label: "Tomorrow", value: addDays(today, 1) },
    { label: "In 3 days", value: addDays(today, 3) },
    { label: "In 1 week", value: addDays(today, 7) },
    { label: "In 2 weeks", value: addDays(today, 14) },
    { label: "In 1 month", value: addMonth(today) },
  ] as const;
}

export function isBuyLaterItemDue(item: BuyLaterItem, today: string): boolean {
  return item.status === "considering" && item.reconsiderAt <= today;
}

export function daysUntilReconsideration(reconsiderAt: string, today: string): number {
  const [targetYear, targetMonth, targetDay] = reconsiderAt.split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  return (Date.UTC(targetYear, targetMonth - 1, targetDay) - Date.UTC(todayYear, todayMonth - 1, todayDay)) / 86_400_000;
}

export function formatReconsiderationDistance(reconsiderAt: string, today: string): string {
  const days = daysUntilReconsideration(reconsiderAt, today);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days % 7 === 0) return `in ${days / 7} ${days === 7 ? "week" : "weeks"}`;
  return `in ${days} days`;
}

export function formatCalendarDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
