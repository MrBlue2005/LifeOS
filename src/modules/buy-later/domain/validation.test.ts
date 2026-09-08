import { describe, expect, it } from "vitest";
import { validateBuyLaterInput, validateNewReconsiderationDate } from "./validation";

function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("Buy Later validation", () => {
  it("accepts the complete manual-input model", () => {
    const result = validateBuyLaterInput(form({
      name: "Headphones", productUrl: "store.example/item", currentPrice: "499,9",
      currency: "ron", note: "Wait before buying", reconsiderAt: "2026-09-14",
    }), { today: "2026-09-07" });
    expect(result).toEqual({ success: true, data: {
      name: "Headphones", productUrl: "https://store.example/item", currentPrice: "499.90",
      currency: "RON", note: "Wait before buying", reconsiderAt: "2026-09-14",
    } });
  });

  it("requires paired exact price data and a current or future date", () => {
    const result = validateBuyLaterInput(form({ name: "Chair", currentPrice: "12.345", currency: "EU", reconsiderAt: "2026-09-01" }), { today: "2026-09-07" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fields).toMatchObject({ currentPrice: expect.any(String), currency: expect.any(String), reconsiderAt: expect.any(String) });
  });

  it("keeps price and currency genuinely optional", () => {
    expect(validateBuyLaterInput(form({ name: "Chair", reconsiderAt: "2026-09-08" }), { today: "2026-09-07" })).toEqual({
      success: true,
      data: { name: "Chair", productUrl: null, currentPrice: null, currency: null, note: null, reconsiderAt: "2026-09-08" },
    });
  });

  it("requires a genuinely new reconsideration date", () => {
    expect(validateNewReconsiderationDate(form({ reconsiderAt: "2026-09-07" }), "2026-09-07").success).toBe(false);
    expect(validateNewReconsiderationDate(form({ reconsiderAt: "2026-09-08" }), "2026-09-07")).toEqual({ success: true, data: "2026-09-08" });
  });
});
