import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260908180000_add_buy_later_push_mutations.sql"),
  "utf8",
).toLowerCase();

describe("Buy Later push mutation boundary", () => {
  it("derives ownership from auth.uid and returns a safe endpoint-conflict result", () => {
    expect(migration).toContain("current_user_id uuid := auth.uid()");
    expect(migration).toContain("where public.buy_later_push_subscriptions.user_id = current_user_id");
    expect(migration).toContain("return 'endpoint_conflict'");
  });

  it("keeps subscription secrets unreadable while allowing only authenticated RPC execution", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("revoke all on function");
    expect(migration).toContain("grant execute on function public.enable_buy_later_push_reminders");
    expect(migration).toContain("set active = false, revoked_at = now()");
    expect(migration).not.toContain("service_role");
  });
});
