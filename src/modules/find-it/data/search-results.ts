import type { FindItItem, FindItItemSearchResult } from "../types";

export const FIND_IT_SEARCH_RESULT_LIMIT = 50;

export type FindItAliasSearchRow = Readonly<{
  itemId: string;
  alias: string;
  normalizedAlias: string;
}>;

function compareItems(left: FindItItem, right: FindItItem): number {
  if (left.updatedAt !== right.updatedAt) {
    return left.updatedAt < right.updatedAt ? 1 : -1;
  }

  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

/**
 * Alias rows are ordered by normalized alias, then row ID before this helper
 * receives them. The first row for an item is therefore the stable alias
 * explanation retained for future presentation work.
 */
export function mergeFindItSearchResults(
  canonicalItems: readonly FindItItem[],
  aliasRows: readonly FindItAliasSearchRow[],
  aliasItems: readonly FindItItem[],
): readonly FindItItemSearchResult[] {
  const canonicalIds = new Set(canonicalItems.map((item) => item.id));
  const aliasByItemId = new Map<string, FindItAliasSearchRow>();

  for (const aliasRow of aliasRows) {
    if (!aliasByItemId.has(aliasRow.itemId)) {
      aliasByItemId.set(aliasRow.itemId, aliasRow);
    }
  }

  const aliasOnlyItems = aliasItems
    .filter((item) => !canonicalIds.has(item.id) && aliasByItemId.has(item.id))
    .sort(compareItems);

  return [
    ...canonicalItems.map((item) => ({
      item,
      match: { kind: "canonical" as const },
    })),
    ...aliasOnlyItems.map((item) => ({
      item,
      match: {
        kind: "alias" as const,
        matchedAlias: aliasByItemId.get(item.id)?.alias ?? "",
      },
    })),
  ].slice(0, FIND_IT_SEARCH_RESULT_LIMIT);
}
