import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FindItItem, FindItItemAlias, FindItLocation } from "./types";

const queryMocks = vi.hoisted(() => ({
  getItemById: vi.fn(),
  listItemAliases: vi.fn(),
  listItems: vi.fn(),
  listLocations: vi.fn(),
  searchItems: vi.fn(),
}));

vi.mock("./data/queries", () => ({
  getItemById: queryMocks.getItemById,
  listItemAliases: queryMocks.listItemAliases,
  listItems: queryMocks.listItems,
  listLocations: queryMocks.listLocations,
  searchItems: queryMocks.searchItems,
}));

import {
  FindItHomeScreen,
  ItemDetailScreen,
  LocationsScreen,
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
    queryMocks.listItemAliases.mockReset();
    queryMocks.listItems.mockReset();
    queryMocks.listLocations.mockReset();
    queryMocks.searchItems.mockReset();
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
    expect(queryMocks.searchItems).not.toHaveBeenCalled();
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
    expect(html).not.toContain("Matched alias:");
  });

  it("keeps deterministic query and clear-search behavior visible", async () => {
    queryMocks.searchItems.mockResolvedValue([]);
    queryMocks.listLocations.mockResolvedValue([location]);

    const html = renderToStaticMarkup(
      await FindItHomeScreen({
        userId: location.userId,
        rawQuery: "passport",
      }),
    );

    expect(queryMocks.searchItems).toHaveBeenCalledWith(location.userId, "passport");
    expect(html).toContain("Results for “passport”");
    expect(html).toContain("Clear search");
  });

  it("keeps an alias-matched item's current location path in search results", async () => {
    const movedLocation: FindItLocation = {
      ...location,
      id: "10000000-0000-4000-8000-000000000002",
      name: "Hall closet",
      parentId: location.id,
    };
    const movedItem = { ...item, locationId: movedLocation.id };
    queryMocks.searchItems.mockResolvedValue([
      { item: movedItem, match: { kind: "alias", matchedAlias: "Travel document" } },
    ]);
    queryMocks.listLocations.mockResolvedValue([location, movedLocation]);

    const html = renderToStaticMarkup(
      await FindItHomeScreen({ userId: location.userId, rawQuery: "travel" }),
    );

    expect(html).toContain("Passport");
    expect(html).toContain("Top Drawer");
    expect(html).toContain("Hall closet");
    expect(html).toContain("Matched alias: Travel document");
  });
});

describe("item screens", () => {
  beforeEach(() => {
    queryMocks.getItemById.mockReset();
    queryMocks.listItemAliases.mockReset();
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
    expect(html).not.toContain("Also known as");
  });

  it("uses move language and keeps deletion separate when editing", async () => {
    queryMocks.getItemById.mockResolvedValue(item);
    queryMocks.listLocations.mockResolvedValue([location]);
    queryMocks.listItemAliases.mockResolvedValue([]);

    const html = renderToStaticMarkup(
      await ItemDetailScreen({ itemId: item.id, userId: item.userId }),
    );

    expect(html).toContain("Edit or move this item");
    expect(html).toContain("Move item to");
    expect(html).toContain("Top Drawer");
    expect(html).toContain("Delete this item");
    expect(html).toContain("Also known as");
    expect(html).toContain("No aliases yet.");
  });

  it("renders saved aliases below the unchanged item edit form", async () => {
    const alias: FindItItemAlias = {
      id: "40000000-0000-4000-8000-000000000001",
      itemId: item.id,
      alias: "Travel document",
      createdAt: "2026-09-10T00:00:00.000Z",
    };
    queryMocks.getItemById.mockResolvedValue(item);
    queryMocks.listLocations.mockResolvedValue([location]);
    queryMocks.listItemAliases.mockResolvedValue([alias]);

    const html = renderToStaticMarkup(
      await ItemDetailScreen({ itemId: item.id, userId: item.userId }),
    );

    expect(html).toContain("Travel document");
    expect(html).toContain('aria-label="Remove alias Travel document"');
    expect(html).toContain("Add another name");
    expect(html).toContain("Move item to");
  });
});

describe("LocationsScreen", () => {
  beforeEach(() => {
    queryMocks.listItems.mockReset();
    queryMocks.listLocations.mockReset();
    queryMocks.listItems.mockResolvedValue([]);
  });

  it("keeps first location creation visible during setup", async () => {
    queryMocks.listLocations.mockResolvedValue([]);

    const html = renderToStaticMarkup(
      await LocationsScreen({ userId: location.userId }),
    );

    expect(html).toContain('class="new-root-card" open=""');
    expect(html).toContain("Create the places where you keep things.");
  });

  it("uses a compact location disclosure and consistent return label after setup", async () => {
    queryMocks.listLocations.mockResolvedValue([location]);

    const html = renderToStaticMarkup(
      await LocationsScreen({ userId: location.userId }),
    );

    expect(html).toContain("Back to Find It");
    expect(html).toContain('class="new-root-card"');
    expect(html).not.toContain('class="new-root-card" open=""');
  });
});
