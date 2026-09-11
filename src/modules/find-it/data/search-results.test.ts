import { describe, expect, it } from "vitest";

import type { FindItItem } from "../types";
import {
  FIND_IT_SEARCH_RESULT_LIMIT,
  mergeFindItSearchResults,
} from "./search-results";

const userId = "30000000-0000-4000-8000-000000000001";

function item(
  id: string,
  name: string,
  updatedAt: string,
  locationId = "10000000-0000-4000-8000-000000000001",
): FindItItem {
  return {
    id,
    userId,
    name,
    description: null,
    locationId,
    createdAt: updatedAt,
    updatedAt,
  };
}

describe("mergeFindItSearchResults", () => {
  it("returns canonical-only matches with canonical metadata", () => {
    const passport = item("20000000-0000-4000-8000-000000000001", "Passport", "2026-09-10T00:00:00Z");

    expect(mergeFindItSearchResults([passport], [], [])).toEqual([
      { item: passport, match: { kind: "canonical" } },
    ]);
  });

  it("returns alias-only partial matches and retains one stable matching alias", () => {
    const flashlight = item("20000000-0000-4000-8000-000000000002", "Flashlight", "2026-09-10T00:00:00Z");
    const results = mergeFindItSearchResults(
      [],
      [
        { itemId: flashlight.id, alias: "Torch", normalizedAlias: "torch" },
        { itemId: flashlight.id, alias: "Torch light", normalizedAlias: "torch light" },
      ],
      [flashlight],
    );

    expect(results).toEqual([
      { item: flashlight, match: { kind: "alias", matchedAlias: "Torch" } },
    ]);
  });

  it("deduplicates canonical and multiple alias matches by item ID", () => {
    const flashlight = item("20000000-0000-4000-8000-000000000003", "Torch case", "2026-09-10T00:00:00Z");

    expect(
      mergeFindItSearchResults(
        [flashlight],
        [
          { itemId: flashlight.id, alias: "Torch", normalizedAlias: "torch" },
          { itemId: flashlight.id, alias: "Torchlight", normalizedAlias: "torchlight" },
        ],
        [flashlight],
      ),
    ).toEqual([{ item: flashlight, match: { kind: "canonical" } }]);
  });

  it("ranks canonical matches before alias-only matches and uses updated_at/id ordering", () => {
    const canonicalOlder = item("20000000-0000-4000-8000-000000000010", "Torch holder", "2026-09-09T00:00:00Z");
    const canonicalNewer = item("20000000-0000-4000-8000-000000000011", "Torch bag", "2026-09-10T00:00:00Z");
    const aliasEarlierId = item("20000000-0000-4000-8000-000000000012", "Flashlight", "2026-09-08T00:00:00Z");
    const aliasLaterId = item("20000000-0000-4000-8000-000000000013", "Lamp", "2026-09-08T00:00:00Z");
    const results = mergeFindItSearchResults(
      [canonicalNewer, canonicalOlder],
      [
        { itemId: aliasLaterId.id, alias: "Torch lamp", normalizedAlias: "torch lamp" },
        { itemId: aliasEarlierId.id, alias: "Torch", normalizedAlias: "torch" },
      ],
      [aliasLaterId, aliasEarlierId],
    );

    expect(results.map((result) => result.item.id)).toEqual([
      canonicalNewer.id,
      canonicalOlder.id,
      aliasEarlierId.id,
      aliasLaterId.id,
    ]);
  });

  it("does not return removed aliases and caps combined results", () => {
    const removedAliasItem = item("20000000-0000-4000-8000-000000000020", "Flashlight", "2026-09-10T00:00:00Z");
    expect(mergeFindItSearchResults([], [], [removedAliasItem])).toEqual([]);

    const canonicalItems = Array.from({ length: FIND_IT_SEARCH_RESULT_LIMIT + 1 }, (_, index) =>
      item(
        `20000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        `Item ${index}`,
        `2026-09-10T00:00:${String(59 - index).padStart(2, "0")}Z`,
      ),
    );
    expect(mergeFindItSearchResults(canonicalItems, [], [])).toHaveLength(FIND_IT_SEARCH_RESULT_LIMIT);
  });
});
