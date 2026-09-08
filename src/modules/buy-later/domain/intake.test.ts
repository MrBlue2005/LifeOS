import { describe, expect, it } from "vitest";
import { parseBuyLaterIntake } from "./intake";

describe("Buy Later share intake", () => {
  it("normalizes a safe URL and preserves it in the local return path", () => {
    const intake = parseBuyLaterIntake({ url: "example.com/product?id=1" });
    expect(intake.initialValues.productUrl).toBe("https://example.com/product?id=1");
    expect(intake.invalidFields).toEqual([]);
    expect(intake.returnPath).toBe("/buy-later/import?url=https%3A%2F%2Fexample.com%2Fproduct%3Fid%3D1");
  });

  it("prefills title and maps text directly to the existing note field", () => {
    const intake = parseBuyLaterIntake({ title: "Desk lamp", text: "For the reading corner" });
    expect(intake.initialValues).toMatchObject({ name: "Desk lamp", note: "For the reading corner" });
    expect(intake.returnPath).toBe("/buy-later/import?title=Desk+lamp&text=For+the+reading+corner");
  });

  it.each([
    ["a malformed URL", "not a URL"],
    ["an unsafe scheme", "javascript:alert(1)"],
    ["a credential-bearing URL", "https://user:password@example.com/product"],
  ])("rejects %s", (_label, url) => {
    const intake = parseBuyLaterIntake({ url });
    expect(intake.initialValues.productUrl).toBe("");
    expect(intake.invalidFields).toContain("url");
    expect(intake.returnPath).toBe("/buy-later/import");
  });

  it("rejects overlong values instead of truncating them", () => {
    const intake = parseBuyLaterIntake({
      url: `https://example.com/${"a".repeat(2040)}`,
      title: "t".repeat(161),
      text: "n".repeat(1001),
    });
    expect(intake.initialValues).toEqual({ name: "", productUrl: "", note: "" });
    expect(intake.invalidFields).toEqual(["url", "title", "text"]);
  });

  it("uses an empty, local intake path when parameters are missing or repeated", () => {
    expect(parseBuyLaterIntake({}).returnPath).toBe("/buy-later/import");
    expect(parseBuyLaterIntake({ url: ["https://example.com", "https://other.example"] })).toMatchObject({
      initialValues: { name: "", productUrl: "", note: "" },
      returnPath: "/buy-later/import",
    });
  });
});
