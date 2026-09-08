import { describe, expect, it } from "vitest";
import { extractProductTitle } from "./extract-title";

describe("Buy Later product title extraction", () => {
  it("prefers og:title over the document and Twitter titles", () => {
    const html = `
      <title>Document title</title>
      <meta name="twitter:title" content="Twitter title">
      <meta content="Open Graph title" property="og:title">
    `;
    expect(extractProductTitle(html)).toBe("Open Graph title");
  });

  it("falls back to the document title and then Twitter title", () => {
    expect(extractProductTitle("<title>Document title</title>")).toBe("Document title");
    expect(extractProductTitle('<meta name="twitter:title" content="Twitter title">')).toBe("Twitter title");
  });

  it("decodes entities and collapses title whitespace", () => {
    expect(extractProductTitle("<title>  Lamp&nbsp; &amp;   Shade &#8212; Blue </title>")).toBe(
      "Lamp & Shade — Blue",
    );
  });

  it("limits extracted titles to 160 characters", () => {
    expect(extractProductTitle(`<title>${"a".repeat(200)}</title>`)).toHaveLength(160);
  });
});
