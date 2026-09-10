import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260910170000_add_buy_later_reminder_claims.sql"),
  "utf8",
).toLowerCase();

describe("Buy Later reminder claim migration", () => {
  it("claims eligible reminders atomically before delivery with per-device identity", () => {
    expect(migration).toContain("create or replace function public.claim_buy_later_due_reminders");
    expect(migration).toContain("insert into public.buy_later_reminder_deliveries");
    expect(migration).toContain("on conflict (item_id, reconsider_at, subscription_id, channel) do nothing");
    expect(migration).toContain("returning delivery.id, delivery.user_id, delivery.item_id, delivery.reconsider_at, delivery.subscription_id");
  });

  it("enforces timezone, policy-hour, status, rollout, subscription, and batch boundaries in the database", () => {
    expect(migration).toContain("pg_catalog.pg_timezone_names");
    expect(migration).toContain("extract(hour from run_at at time zone preference.timezone) >= 9");
    expect(migration).toContain("candidate.status = 'considering'");
    expect(migration).toContain("candidate.reconsider_at <= preference.local_date");
    expect(migration).toContain("candidate.reconsider_at >= rollout_date");
    expect(migration).toContain("subscription.active");
    expect(migration).toContain("from public.buy_later_reminder_deliveries as existing_delivery");
    expect(migration).toContain("dense_rank() over");
    expect(migration).toContain("where item_rank <= max_items_per_user");
    expect(migration).toContain("limit max_pushes");
  });

  it("keeps the helper service-only and contains no scheduler credential", () => {
    expect(migration).toContain("security invoker");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("revoke all on function public.claim_buy_later_due_reminders");
    expect(migration).toContain("to service_role");
    expect(migration).not.toContain("buy_later_reminder_cron_secret");
    expect(migration).not.toContain("http_post");
  });
});
