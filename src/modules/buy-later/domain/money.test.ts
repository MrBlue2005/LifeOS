import { describe, expect, it } from "vitest";
import { formatPrice, normalizePrice } from "./money";

describe("Buy Later money", () => {
  it("normalizes manual prices without floating-point arithmetic", () => {
    expect(normalizePrice("0012,5")).toEqual({ success: true, value: "12.50" });
    expect(normalizePrice("12.345").success).toBe(false);
  });

  it("formats exact decimal strings", () => {
    expect(formatPrice("12345.5", "RON")).toBe("RON 12,345.50");
  });
});
