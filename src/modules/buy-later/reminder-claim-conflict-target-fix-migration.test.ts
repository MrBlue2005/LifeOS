import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const notificationMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260908170000_create_buy_later_notifications.sql"),
  "utf8",
).toLowerCase();

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260910190000_fix_buy_later_reminder_conflict_target.sql"),
  "utf8",
).toLowerCase();

describe("Buy Later reminder claim conflict-target fix migration", () => {
  it("uses the existing named delivery-identity unique constraint", () => {
    expect(notificationMigration).toContain(
      "constraint buy_later_reminder_deliveries_identity_key\n    unique (item_id, reconsider_at, subscription_id, channel)",
    );
    expect(migration).toContain(
      "on conflict on constraint buy_later_reminder_deliveries_identity_key do nothing",
    );
    expect(migration).not.toContain("on conflict (item_id, reconsider_at, subscription_id, channel) do nothing");
  });

  it("keeps the claim function contract and security boundary intact", () => {
    expect(migration).toContain("create or replace function public.claim_buy_later_due_reminders");
    expect(migration).toMatch(
      /run_at timestamptz,\s+rollout_date date,\s+max_users integer,\s+max_items_per_user integer,\s+max_pushes integer/,
    );
    expect(migration).toMatch(
      /returns table \(\s+delivery_id uuid,\s+user_id uuid,\s+item_id uuid,\s+item_name text,\s+reconsider_at date,\s+subscription_id uuid,\s+endpoint text,\s+p256dh text,\s+auth text,\s+include_item_name boolean\s+\)/,
    );
    expect(migration).toContain("security invoker");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
    expect(migration).not.toContain("security definer");
  });

  it("keeps all query references that can collide with output variables qualified", () => {
    expect(migration).toContain("where ranked.item_rank <= max_items_per_user");
    expect(migration).toContain("order by ranked.user_id, ranked.reconsider_at, ranked.item_id, ranked.subscription_id");
    expect(migration).toContain("returning delivery.id, delivery.user_id, delivery.item_id, delivery.reconsider_at, delivery.subscription_id");
    expect(migration).toContain("on candidate.user_id = claimed.user_id");
    expect(migration).toContain("and candidate.subscription_id = claimed.subscription_id");
    expect(migration).not.toContain("where item_rank <= max_items_per_user");
    expect(migration).not.toContain("order by user_id, reconsider_at, item_id, subscription_id");
  });
});
