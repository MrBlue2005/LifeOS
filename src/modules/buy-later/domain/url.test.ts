import { describe, expect, it } from "vitest";
import { normalizeProductUrl, productDomain } from "./url";

describe("Buy Later URLs", () => {
  it("normalizes useful http links and displays their domain", () => {
    expect(normalizeProductUrl("shop.example.com/item")).toBe("https://shop.example.com/item");
    expect(productDomain("https://www.example.com/item")).toBe("example.com");
  });

  it("rejects unsafe or credential-bearing URLs", () => {
    expect(normalizeProductUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeProductUrl("https://user:pass@example.com")).toBeNull();
  });
});
