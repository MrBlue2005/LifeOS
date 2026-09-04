import { describe, expect, it } from "vitest";

import type { FindItLocation } from "../types";
import {
  buildLocationTree,
  formatLocationPath,
  getLocationPath,
  wouldCreateLocationCycle,
} from "./hierarchy";

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
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  };
}

const locations = [
  location("home", "Home"),
  location("office", "Office", "home"),
  location("desk", "Desk", "office"),
  location("drawer", "Bottom Drawer", "desk"),
];

describe("location hierarchy", () => {
  it("derives and formats the complete location path", () => {
    const path = getLocationPath("drawer", locations);

    expect(path).toEqual(["Home", "Office", "Desk", "Bottom Drawer"]);
    expect(formatLocationPath(path)).toBe(
      "Home → Office → Desk → Bottom Drawer",
    );
  });

  it("orders roots and children deterministically", () => {
    const tree = buildLocationTree([
      location("storage", "Storage"),
      ...locations,
      location("cabinet", "Cabinet", "office"),
    ]);

    expect(tree.map(({ location: entry }) => entry.name)).toEqual([
      "Home",
      "Office",
      "Cabinet",
      "Desk",
      "Bottom Drawer",
      "Storage",
    ]);
    expect(tree.find(({ location: entry }) => entry.id === "drawer")?.depth).toBe(3);
  });

  it("detects self-parenting and descendant cycles", () => {
    expect(wouldCreateLocationCycle("office", "office", locations)).toBe(true);
    expect(wouldCreateLocationCycle("office", "drawer", locations)).toBe(true);
    expect(wouldCreateLocationCycle("drawer", "home", locations)).toBe(false);
    expect(wouldCreateLocationCycle("office", null, locations)).toBe(false);
  });

  it("rejects corrupt hierarchy data instead of returning a misleading path", () => {
    expect(() =>
      getLocationPath("missing-child", [
        location("missing-child", "Drawer", "missing-parent"),
      ]),
    ).toThrow("missing parent");
  });
});
