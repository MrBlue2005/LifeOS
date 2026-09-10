import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260910180000_fix_buy_later_reminder_claim_ambiguity.sql"),
  "utf8",
).toLowerCase();

describe("Buy Later reminder claim ambiguity fix migration", () => {
  it("replaces the deployed function in a forward migration without changing its contract", () => {
    expect(migration).toContain("create or replace function public.claim_buy_later_due_reminders");
    expect(migration).toContain("run_at timestamptz");
    expect(migration).toContain("rollout_date date");
    expect(migration).toContain("delivery_id uuid");
    expect(migration).toContain("include_item_name boolean");
  });

  it("keeps invoker security, fixed search path, and service-role-only execution", () => {
    expect(migration).toContain("security invoker");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
    expect(migration).not.toContain("security definer");
  });

  it("qualifies output-name references in the ranked claim query", () => {
    expect(migration).toContain("from ranked_subscriptions as ranked");
    expect(migration).toContain("where ranked.item_rank <= max_items_per_user");
    expect(migration).toContain("order by ranked.user_id, ranked.reconsider_at, ranked.item_id, ranked.subscription_id");
    expect(migration).not.toContain("where item_rank <= max_items_per_user");
    expect(migration).not.toContain("order by user_id, reconsider_at, item_id, subscription_id");
  });
});
