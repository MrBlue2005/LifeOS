import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const foundation = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260910200000_add_find_it_item_aliases.sql"),
  "utf8",
).toLowerCase();

const privilegeFix = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260910210000_fix_find_it_alias_normalization_execute.sql",
  ),
  "utf8",
).toLowerCase();

describe("Find It alias normalization execute privileges", () => {
  it("grants authenticated only the pure helpers needed by generated values and checks", () => {
    expect(privilegeFix).toContain(
      "grant execute on function public.normalize_find_it_alias_display(text) to authenticated",
    );
    expect(privilegeFix).toContain(
      "grant execute on function public.normalize_find_it_alias(text) to authenticated",
    );
    expect(privilegeFix).not.toContain(" to anon");
    expect(privilegeFix).not.toContain(" to public");
    expect(foundation).toContain(
      "revoke all on function public.normalize_find_it_alias_display(text) from public, anon, authenticated",
    );
    expect(foundation).toContain(
      "revoke all on function public.normalize_find_it_alias(text) from public, anon, authenticated",
    );
    expect(privilegeFix).not.toContain("prevent_find_it_item_alias_link_change");
    expect(privilegeFix).not.toContain("enforce_find_it_item_alias_limit");
  });

  it("keeps the granted normalization helpers pure and non-privileged", () => {
    expect(foundation).toContain("create function public.normalize_find_it_alias_display(value text)");
    expect(foundation).toContain("create function public.normalize_find_it_alias(value text)");
    expect(foundation).toContain("language sql\nimmutable\nstrict\nset search_path = ''");
    expect(foundation).toContain("pg_catalog.regexp_replace");
    expect(foundation).toContain("pg_catalog.lower(public.normalize_find_it_alias_display(value))");
    expect(foundation).not.toContain("security definer");
  });
});
