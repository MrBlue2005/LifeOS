import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase", "migrations", "20260907170000_create_buy_later.sql"), "utf8").toLowerCase();

describe("Buy Later migration invariants", () => {
  it("uses exact money, explicit lifecycle constraints, and useful indexes", () => {
    expect(migration).toContain("current_price numeric(12, 2)");
    expect(migration).toContain("status in ('considering', 'purchased', 'dismissed')");
    expect(migration).toContain("buy_later_items_resolution_valid");
    expect(migration).toContain("buy_later_items_active_due_idx");
    expect(migration).toContain("buy_later_items_history_idx");
  });

  it("enables RLS and grants every owner operation only to authenticated users", () => {
    expect(migration).toContain("alter table public.buy_later_items enable row level security");
    for (const operation of ["select", "insert", "update", "delete"]) {
      expect(migration).toContain(`on public.buy_later_items for ${operation}\nto authenticated`);
    }
    expect(migration.match(/\(select auth\.uid\(\)\) = user_id/g)).toHaveLength(5);
  });
});
