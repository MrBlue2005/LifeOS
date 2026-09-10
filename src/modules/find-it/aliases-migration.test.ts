import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260910200000_add_find_it_item_aliases.sql"),
  "utf8",
).toLowerCase();

describe("Find It alias foundation migration", () => {
  it("creates an owner-scoped alias table with durable ownership and cleanup", () => {
    expect(migration).toContain("create table public.find_it_item_aliases");
    expect(migration).toContain("find_it_items_user_id_id_key unique (user_id, id)");
    expect(migration).toContain("foreign key (user_id, item_id)");
    expect(migration).toContain("references public.find_it_items (user_id, id)");
    expect(migration).toContain("on delete cascade");
  });

  it("keeps aliases private, owner-only, and non-transferable", () => {
    expect(migration).toContain("alter table public.find_it_item_aliases enable row level security");
    expect(migration).toContain("revoke all on table public.find_it_item_aliases from public, anon, authenticated");
    expect(migration).toContain("grant select, insert, update, delete on table public.find_it_item_aliases to authenticated");
    for (const operation of ["select", "insert", "update", "delete"]) {
      expect(migration).toContain(`on public.find_it_item_aliases for ${operation}\nto authenticated`);
    }
    expect(migration).toContain("using ((select auth.uid()) = user_id)");
    expect(migration).toContain("with check ((select auth.uid()) = user_id)");
    expect(migration).toContain("prevent_find_it_item_alias_link_change");
    expect(migration).toContain("new.user_id is distinct from old.user_id");
    expect(migration).toContain("new.item_id is distinct from old.item_id");
  });

  it("enforces normalized per-item uniqueness, stored limits, and search-oriented indexing", () => {
    expect(migration).toContain("normalized_alias text generated always as");
    expect(migration).toContain("find_it_item_aliases_item_alias_key unique (item_id, normalized_alias)");
    expect(migration).toContain("char_length(alias) between 1 and 60");
    expect(migration).toContain("find_it_item_aliases_user_normalized_alias_idx");
    expect(migration).toContain("on public.find_it_item_aliases (user_id, normalized_alias)");
    expect(migration).toContain("enforce_find_it_item_alias_limit");
    expect(migration).toContain("for update");
    expect(migration).toContain("if alias_count >= 12 then");
  });
});
