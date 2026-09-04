import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260904170000_create_find_it.sql",
  ),
  "utf8",
).toLowerCase();

describe("Find It migration security invariants", () => {
  it.each(["find_it_locations", "find_it_items"])(
    "enables RLS and defines all owner operations for %s",
    (table) => {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
      expect(migration).toContain(`on public.${table} for select`);
      expect(migration).toContain(`on public.${table} for insert`);
      expect(migration).toContain(`on public.${table} for update`);
      expect(migration).toContain(`on public.${table} for delete`);
    },
  );

  it("derives ownership from auth and limits policies to authenticated users", () => {
    expect(migration).toContain("user_id uuid not null default auth.uid()");
    expect(
      migration.match(
        /on public\.(?:find_it_locations|find_it_items) for (?:select|insert|update|delete)\s+to authenticated/g,
      ),
    ).toHaveLength(8);
    expect(migration.match(/\(select auth\.uid\(\)\) = user_id/g)).toHaveLength(10);
  });

  it("enforces same-owner parent and item-location relationships", () => {
    expect(migration).toContain("foreign key (user_id, parent_id)");
    expect(migration).toContain("foreign key (user_id, location_id)");
    expect(migration.match(/on delete restrict/g)).toHaveLength(2);
  });

  it("installs cycle prevention and serializes hierarchy changes", () => {
    expect(migration).toContain("prevent_find_it_location_cycle");
    expect(migration).toContain("pg_advisory_xact_lock");
  });
});
