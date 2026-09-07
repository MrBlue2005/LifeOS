import { formatLocationPath, wouldCreateLocationCycle } from "./domain/hierarchy";
import type { FindItLocation, LocationTreeEntry } from "./types";

export type LocationPresentation = Readonly<{
  childCount: number;
  itemCount: number;
  levelLabel: string;
  contextLabel: string;
  deletionBlockers: readonly string[];
}>;

export function getLocationPresentation(
  entry: LocationTreeEntry,
  locations: readonly FindItLocation[],
  itemCounts: Readonly<Record<string, number>>,
): LocationPresentation {
  const childCount = locations.filter(
    ({ parentId }) => parentId === entry.location.id,
  ).length;
  const itemCount = itemCounts[entry.location.id] ?? 0;
  const parentPath = entry.path.slice(0, -1);
  const deletionBlockers: string[] = [];

  if (childCount > 0) {
    deletionBlockers.push(
      `Move the ${childCount} location${childCount === 1 ? "" : "s"} inside it before deleting.`,
    );
  }

  if (itemCount > 0) {
    deletionBlockers.push(
      `Move the ${itemCount} item${itemCount === 1 ? "" : "s"} stored here before deleting.`,
    );
  }

  return {
    childCount,
    itemCount,
    levelLabel: entry.depth === 0 ? "Top level" : `Level ${entry.depth + 1}`,
    contextLabel:
      entry.depth === 0
        ? "A main place"
        : `Inside ${formatLocationPath(parentPath)}`,
    deletionBlockers,
  };
}

export function getMoveDestinationEntries(
  locationId: string,
  entries: readonly LocationTreeEntry[],
  locations: readonly FindItLocation[],
): readonly LocationTreeEntry[] {
  return entries.filter(
    (candidate) =>
      !wouldCreateLocationCycle(locationId, candidate.location.id, locations),
  );
}
