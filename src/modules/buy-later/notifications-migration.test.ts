import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260908170000_create_buy_later_notifications.sql"),
  "utf8",
).toLowerCase();

describe("Buy Later notification migration invariants", () => {
  it("uses private defaults, constrained timezone data, and multiple unique subscriptions", () => {
    expect(migration).toContain("create table public.buy_later_notification_preferences");
    expect(migration).toContain("push_enabled boolean not null default false");
    expect(migration).toContain("include_item_name boolean not null default false");
    expect(migration).toContain("buy_later_notification_preferences_timezone_valid");
    expect(migration).toContain("buy_later_push_subscriptions_endpoint_key unique (endpoint)");
    expect(migration).toContain("buy_later_push_subscriptions_user_id_id_key unique (user_id, id)");
  });

  it("enforces same-owner delivery references and durable per-subscription idempotency", () => {
    expect(migration).toContain("references public.buy_later_items (user_id, id) on delete cascade");
    expect(migration).toContain("references public.buy_later_push_subscriptions (user_id, id) on delete cascade");
    expect(migration).toContain("unique (item_id, reconsider_at, subscription_id, channel)");
    expect(migration).toContain("buy_later_reminder_deliveries_state_valid");
    expect(migration).toContain("buy_later_items_notification_due_idx");
    expect(migration).toContain("buy_later_reminder_deliveries_identity_key");
    expect(migration).toContain("where status = 'considering'");
  });

  it("keeps subscription capability data and delivery records out of normal reads", () => {
    expect(migration).toContain("revoke all on table public.buy_later_push_subscriptions from public, anon, authenticated");
    expect(migration).not.toContain("on public.buy_later_push_subscriptions for select");
    expect(migration).toContain("revoke all on table public.buy_later_reminder_deliveries from public, anon, authenticated");
    for (const table of [
      "buy_later_notification_preferences",
      "buy_later_push_subscriptions",
      "buy_later_reminder_deliveries",
    ]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });
});
