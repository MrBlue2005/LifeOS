import { describe, expect, it } from "vitest";

import { buildLocationTree } from "./domain/hierarchy";
import {
  getLocationPresentation,
  getMoveDestinationEntries,
} from "./location-presentation";
import type { FindItLocation } from "./types";

function location(
  id: string,
  name: string,
  parentId: string | null = null,
): FindItLocation {
  return {
    id,
    name,
    parentId,
    userId: "user-1",
    createdAt: "2026-09-07T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
  };
}

const locations = [
  location("home", "Home"),
  location("bedroom", "Bedroom", "home"),
  location("wardrobe", "Wardrobe", "bedroom"),
  location("drawer", "Top Drawer", "wardrobe"),
  location("office", "Office"),
];

describe("location presentation", () => {
  const entries = buildLocationTree(locations);

  it("describes top-level and nested locations without relying on indentation", () => {
    const home = getLocationPresentation(entries[0], locations, {});
    const wardrobeEntry = entries.find(({ location: entry }) => entry.id === "wardrobe");

    expect(home.levelLabel).toBe("Top level");
    expect(home.contextLabel).toBe("A main place");
    expect(wardrobeEntry).toBeDefined();
    expect(getLocationPresentation(wardrobeEntry!, locations, {}).contextLabel).toBe(
      "Inside Home → Bedroom",
    );
  });

  it("uses existing child and item data for specific deletion blockers", () => {
    const wardrobeEntry = entries.find(({ location: entry }) => entry.id === "wardrobe");
    const presentation = getLocationPresentation(
      wardrobeEntry!,
      locations,
      { wardrobe: 2 },
    );

    expect(presentation.childCount).toBe(1);
    expect(presentation.itemCount).toBe(2);
    expect(presentation.deletionBlockers).toEqual([
      "Move the 1 location inside it before deleting.",
      "Move the 2 items stored here before deleting.",
    ]);
  });

  it("omits self and descendants from move destinations", () => {
    const destinations = getMoveDestinationEntries("wardrobe", entries, locations);

    expect(destinations.map(({ location: entry }) => entry.id)).toEqual([
      "home",
      "bedroom",
      "office",
    ]);
  });
});
