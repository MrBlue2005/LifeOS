import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FindItItem, FindItLocation } from "./types";

const queryMocks = vi.hoisted(() => ({
  getItemById: vi.fn(),
  listItems: vi.fn(),
  listLocations: vi.fn(),
}));

vi.mock("./data/queries", () => ({
  getItemById: queryMocks.getItemById,
  listItems: queryMocks.listItems,
  listLocations: queryMocks.listLocations,
}));

import {
  FindItHomeScreen,
  ItemDetailScreen,
  NewItemScreen,
} from "./screens";

const location: FindItLocation = {
  id: "10000000-0000-4000-8000-000000000001",
  userId: "30000000-0000-4000-8000-000000000001",
  name: "Top Drawer",
  parentId: null,
  createdAt: "2026-09-07T00:00:00.000Z",
  updatedAt: "2026-09-07T00:00:00.000Z",
};

const item: FindItItem = {
  id: "20000000-0000-4000-8000-000000000001",
  userId: location.userId,
  name: "Passport",
  description: "Travel document",
  locationId: location.id,
  createdAt: "2026-09-07T00:00:00.000Z",
  updatedAt: "2026-09-07T00:00:00.000Z",
};

describe("FindItHomeScreen", () => {
  beforeEach(() => {
    queryMocks.getItemById.mockReset();
    queryMocks.listItems.mockReset();
    queryMocks.listLocations.mockReset();
  });

  it("centers the first-run experience on search and location setup", async () => {
    queryMocks.listItems.mockResolvedValue([]);
    queryMocks.listLocations.mockResolvedValue([]);

    const html = renderToStaticMarkup(
      await FindItHomeScreen({ userId: location.userId }),
    );

    expect(html).toContain("What are you trying to find?");
    expect(html).toContain("Search your saved items");
    expect(html).toContain("Create your first location");
    expect(html).not.toContain("href=\"/find-it/items/new\"");
  });

  it("shows primary actions and complete paths for saved items", async () => {
    queryMocks.listItems.mockResolvedValue([item]);
    queryMocks.listLocations.mockResolvedValue([location]);

    const html = renderToStaticMarkup(
      await FindItHomeScreen({ userId: location.userId }),
    );

    expect(html).toContain("Add item");
    expect(html).toContain("Manage locations");
    expect(html).toContain("Passport");
    expect(html).toContain("Top Drawer");
  });

  it("keeps deterministic query and clear-search behavior visible", async () => {
    queryMocks.listItems.mockResolvedValue([]);
    queryMocks.listLocations.mockResolvedValue([location]);

    const html = renderToStaticMarkup(
      await FindItHomeScreen({
        userId: location.userId,
        rawQuery: "passport",
      }),
    );

    expect(queryMocks.listItems).toHaveBeenCalledWith(location.userId, "passport");
    expect(html).toContain("Results for “passport”");
    expect(html).toContain("Clear search");
  });
});

describe("item screens", () => {
  beforeEach(() => {
    queryMocks.getItemById.mockReset();
    queryMocks.listItems.mockReset();
    queryMocks.listLocations.mockReset();
  });

  it("guides users to create a location before adding an item", async () => {
    queryMocks.listLocations.mockResolvedValue([]);

    const html = renderToStaticMarkup(
      await NewItemScreen({ userId: location.userId }),
    );

    expect(html).toContain("You need a place before you can save an item.");
    expect(html).toContain("href=\"/find-it/locations\"");
    expect(html).not.toContain("data-location-picker");
  });

  it("uses the focused add-item form when locations exist", async () => {
    queryMocks.listLocations.mockResolvedValue([location]);

    const html = renderToStaticMarkup(
      await NewItemScreen({ userId: location.userId }),
    );

    expect(html).toContain("Item details");
    expect(html).toContain("Current location");
    expect(html).toContain("Choose a location");
    expect(html).not.toContain("Delete this item");
  });

  it("uses move language and keeps deletion separate when editing", async () => {
    queryMocks.getItemById.mockResolvedValue(item);
    queryMocks.listLocations.mockResolvedValue([location]);

    const html = renderToStaticMarkup(
      await ItemDetailScreen({ itemId: item.id, userId: item.userId }),
    );

    expect(html).toContain("Edit or move this item");
    expect(html).toContain("Move item to");
    expect(html).toContain("Top Drawer");
    expect(html).toContain("Delete this item");
  });
});
