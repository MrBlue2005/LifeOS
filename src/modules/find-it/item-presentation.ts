import { formatLocationPath } from "./domain/hierarchy";
import type { LocationTreeEntry } from "./types";

export function filterLocationEntries(
  entries: readonly LocationTreeEntry[],
  query: string,
): readonly LocationTreeEntry[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return entries;
  }

  return entries.filter((entry) =>
    formatLocationPath(entry.path)
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );
}

export function findLocationEntry(
  entries: readonly LocationTreeEntry[],
  locationId: string,
): LocationTreeEntry | undefined {
  return entries.find(({ location }) => location.id === locationId);
}
