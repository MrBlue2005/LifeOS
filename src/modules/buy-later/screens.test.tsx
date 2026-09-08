import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BuyLaterItem } from "./types";

const queryMocks = vi.hoisted(() => ({ getBuyLaterItem: vi.fn(), getBuyLaterNotificationPreferences: vi.fn(), listConsideringItems: vi.fn(), listResolvedItems: vi.fn() }));
vi.mock("./data/queries", () => queryMocks);
import { parseBuyLaterIntake } from "./domain/intake";
import { BuyLaterHistoryScreen, BuyLaterHomeScreen, BuyLaterImportScreen, BuyLaterItemScreen, NewBuyLaterItemScreen } from "./screens";

const item: BuyLaterItem = {
  id: "40000000-0000-4000-8000-000000000001", userId: "30000000-0000-4000-8000-000000000001",
  name: "Headphones", productUrl: "https://store.example/item", currentPrice: "499.90",
  currency: "RON", note: "Wait", reconsiderAt: "2026-09-08", status: "considering",
  resolvedAt: null, createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z",
};

describe("Buy Later screens", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-08T12:00:00.000Z"));
    Object.values(queryMocks).forEach((mock) => mock.mockReset());
    queryMocks.getBuyLaterNotificationPreferences.mockResolvedValue(null);
  });

  afterEach(() => vi.useRealTimers());

  it("prioritizes due items and keeps the add action visible", async () => {
    queryMocks.listConsideringItems.mockResolvedValue([item]);
    const html = renderToStaticMarkup(await BuyLaterHomeScreen({ userId: item.userId }));
    expect(html).toContain("Buy with a clearer head.");
    expect(html).toContain("Due now");
    expect(html).toContain("Save an item");
    expect(html).toContain("Remind me when items are ready to reconsider.");
    expect(html).not.toContain("Still considering");
    expect(html).not.toContain("Everything active is ready to review.");
    expect(html).toContain('href="/buy-later/history"');
  });

  it("keeps the empty home focused without an oversized zero-due section", async () => {
    queryMocks.listConsideringItems.mockResolvedValue([]);
    const html = renderToStaticMarkup(await BuyLaterHomeScreen({ userId: item.userId }));
    expect(html).toContain("Give a purchase some breathing room.");
    expect(html).toContain("Save your first item");
    expect(html).not.toContain("0 due");
    expect(html).not.toContain("Needs a decision");
  });

  it("uses item-first card hierarchy and a compact calm status when nothing is due", async () => {
    queryMocks.listConsideringItems.mockResolvedValue([{ ...item, reconsiderAt: "2026-09-15" }]);
    const html = renderToStaticMarkup(await BuyLaterHomeScreen({ userId: item.userId }));
    expect(html.indexOf("Headphones")).toBeLessThan(html.indexOf("Reconsider in 1 week"));
    expect(html).toContain("Nothing needs a decision today.");
    expect(html).not.toContain("No price saved");
  });

  it("makes reconsideration explicit on a due item", async () => {
    queryMocks.getBuyLaterItem.mockResolvedValue(item);
    const html = renderToStaticMarkup(await BuyLaterItemScreen({ userId: item.userId, itemId: item.id }));
    expect(html).toContain("Do you still want this?");
    expect(html).toContain("I still want it");
    expect(html).toContain("I bought it");
    expect(html).toContain("I don’t want it anymore");
    expect(html).toContain('min="2026-09-09"');
    expect(html).toContain("Delete this record");
  });

  it("keeps a future considering item in a calm waiting state with early final actions", async () => {
    queryMocks.getBuyLaterItem.mockResolvedValue({ ...item, reconsiderAt: "2026-09-15" });
    const html = renderToStaticMarkup(await BuyLaterItemScreen({ userId: item.userId, itemId: item.id }));
    expect(html).toContain("Waiting");
    expect(html).toContain("Reconsider in 1 week");
    expect(html).toContain("Sep 15, 2026");
    expect(html).toContain("Saved Sep 1, 2026");
    expect(html).not.toContain("Do you still want this?");
    expect(html).not.toContain("Ready to decide?");
    expect(html).not.toContain("I still want it");
    expect(html).toContain("Mark as purchased");
    expect(html).toContain("I don’t want this anymore");
  });

  it("preserves resolved items in history", async () => {
    queryMocks.listResolvedItems.mockResolvedValue([{ ...item, status: "dismissed", resolvedAt: "2026-09-07T00:00:00.000Z" }]);
    const html = renderToStaticMarkup(await BuyLaterHistoryScreen({ userId: item.userId }));
    expect(html).toContain("Past decisions");
    expect(html).toContain("Dismissed");
  });

  it("prefills the existing form without saving on intake render", () => {
    const intake = parseBuyLaterIntake({
      url: "https://example.com/product",
      title: "Desk lamp",
      text: "For the reading corner",
    });
    const html = renderToStaticMarkup(<BuyLaterImportScreen intake={intake} />);
    expect(html).toContain("Save to Buy Later");
    expect(html).toContain('name="name"');
    expect(html).toContain('value="Desk lamp"');
    expect(html).toContain('value="https://example.com/product"');
    expect(html).toContain('name="note"');
    expect(html).toContain("For the reading corner");
    expect(html).toContain("Save for later");
    expect(html).not.toContain("Saved for later.");
  });

  it("keeps the normal Add Item screen unchanged without prefill values", () => {
    const html = renderToStaticMarkup(<NewBuyLaterItemScreen />);
    expect(html).toContain("Save it for later");
    expect(html).toContain('name="name"');
    expect(html).not.toContain('value="Desk lamp"');
    expect(html).not.toContain('value="https://example.com/product"');
  });
});
