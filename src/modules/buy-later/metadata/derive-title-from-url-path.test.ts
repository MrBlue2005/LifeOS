import { describe, expect, it } from "vitest";
import { deriveTitleFromUrlPath } from "./derive-title-from-url-path";

describe("Buy Later URL slug title fallback", () => {
  it("derives a title from a descriptive product slug", () => {
    expect(deriveTitleFromUrlPath("https://shop.example/sony-wh-1000xm5-wireless-noise-cancelling-headphones/")).toBe(
      "Sony wh 1000xm5 wireless noise cancelling headphones",
    );
  });

  it("uses the long descriptive segment before e-commerce structural and ID segments", () => {
    const url = "https://www.emag.ro/set-de-constructie-bedeer-nava-de-lupta-missouri-2228pcs-82-5-x-24-5-x-10-1-cm-cu-o-baza-frumoasa-perfecta-pentru-a-fi-oferita-cadou-pasionatilor-si-entuziastilor-militari-cu-varsta-de-14-ani-si-peste/pd/DT5BMW3BM/";
    expect(deriveTitleFromUrlPath(url)).toBe(
      "Set de constructie bedeer nava de lupta missouri 2228pcs 82 5 x 24 5 x 10 1 cm cu o baza frumoasa perfecta pentru a fi oferita cadou pasionatilor si",
    );
  });

  it("decodes encoded text and normalizes underscores", () => {
    expect(deriveTitleFromUrlPath("https://shop.example/caf%C3%A9_lamp%C4%83_de_birou/")).toBe("Café lampă de birou");
  });

  it("chooses the longest plausible segment before a terminal path marker", () => {
    expect(deriveTitleFromUrlPath("https://shop.example/brand/compact-wireless-keyboard-with-backlight/p/ABC123")).toBe(
      "Compact wireless keyboard with backlight",
    );
  });

  it.each([
    "https://shop.example/product/123456",
    "https://shop.example/p/ABC123",
    "https://shop.example/category/gaming-laptops",
    "https://shop.example/products/item",
  ])("ignores generic, numeric, and opaque paths: %s", (url) => {
    expect(deriveTitleFromUrlPath(url)).toBeUndefined();
  });

  it("uses only the pathname and ignores query parameters", () => {
    expect(
      deriveTitleFromUrlPath("https://shop.example/portable-reading-lamp?title=Injected+query+title&utm_source=share"),
    ).toBe("Portable reading lamp");
  });

  it("truncates a very long slug on a word boundary within the item-name limit", () => {
    const title = deriveTitleFromUrlPath(`https://shop.example/${Array.from({ length: 50 }, () => "descriptive").join("-")}`);
    expect(title).toBeDefined();
    expect(title).toHaveLength(155);
    expect(title).not.toMatch(/\s$/);
  });
});
