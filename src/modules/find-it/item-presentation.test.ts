import { describe, expect, it } from "vitest";

import { buildLocationTree } from "./domain/hierarchy";
import {
  filterLocationEntries,
  findLocationEntry,
} from "./item-presentation";
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

const entries = buildLocationTree([
  location("home", "Home"),
  location("office", "Office", "home"),
  location("office-drawer", "Top Drawer", "office"),
  location("bedroom", "Bedroom", "home"),
  location("bedroom-drawer", "Top Drawer", "bedroom"),
]);

describe("item location presentation", () => {
  it("filters locations by any part of their complete path", () => {
    expect(
      filterLocationEntries(entries, "  OFFICE ").map(
        ({ location: entry }) => entry.id,
      ),
    ).toEqual(["office", "office-drawer"]);
  });

  it("keeps similarly named locations distinguishable by their paths", () => {
    const drawers = filterLocationEntries(entries, "top drawer");

    expect(drawers.map(({ path }) => path.join(" → "))).toEqual([
      "Home → Bedroom → Top Drawer",
      "Home → Office → Top Drawer",
    ]);
  });

  it("resolves the complete selected location entry", () => {
    expect(findLocationEntry(entries, "office-drawer")?.path).toEqual([
      "Home",
      "Office",
      "Top Drawer",
    ]);
    expect(findLocationEntry(entries, "missing")).toBeUndefined();
  });
});
