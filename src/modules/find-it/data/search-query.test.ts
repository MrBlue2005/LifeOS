import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const queries = readFileSync(
  join(process.cwd(), "src", "modules", "find-it", "data", "queries.ts"),
  "utf8",
);

describe("Find It alias-aware query strategy", () => {
  it("keeps canonical, alias, and alias-item fetches owner scoped", () => {
    expect(queries.match(/\.eq\("user_id", userId\)/g)?.length).toBeGreaterThanOrEqual(4);
    expect(queries).toContain('.from("find_it_item_aliases")');
    expect(queries).toContain('.in("id", aliasItemIds)');
  });

  it("uses normalized, escaped alias partial matching with bounded presentation output", () => {
    expect(queries).toContain("const aliasQuery = normalizeFindItAlias(canonicalQuery)");
    expect(queries).toContain("const aliasPattern = toIlikeContainsPattern(aliasQuery)");
    expect(queries).toContain('.ilike("name", canonicalPattern)');
    expect(queries).toContain('.order("updated_at", { ascending: false })');
    expect(queries).toContain('.ilike("normalized_alias", aliasPattern)');
    expect(queries).toContain('.order("normalized_alias", { ascending: true })');
    expect(queries).toContain('.order("id", { ascending: true })');
    expect(queries).toContain(".limit(FIND_IT_SEARCH_RESULT_LIMIT)");
  });
});
