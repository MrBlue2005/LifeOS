import { describe, expect, it, vi } from "vitest";
import { parseBuyLaterIntake } from "../domain/intake";
import { enrichBuyLaterIntake } from "./enrich-intake";

describe("Buy Later intake enrichment", () => {
  it("keeps an explicit query title and avoids a metadata request", async () => {
    const intake = parseBuyLaterIntake({ url: "https://example.com/product", title: "Shared title" });
    const fetchMetadata = vi.fn().mockResolvedValue({ title: "Fetched title" });
    await expect(enrichBuyLaterIntake(intake, fetchMetadata)).resolves.toBe(intake);
    expect(fetchMetadata).not.toHaveBeenCalled();
  });

  it("prefills a URL-only intake with the fetched title", async () => {
    const intake = parseBuyLaterIntake({ url: "https://example.com/product" });
    const enriched = await enrichBuyLaterIntake(intake, async () => ({ title: "Fetched title" }));
    expect(enriched.initialValues).toEqual({
      name: "Fetched title",
      productUrl: "https://example.com/product",
      note: "",
    });
    expect(enriched.returnPath).toBe(intake.returnPath);
  });

  it("leaves the editable intake usable when enrichment fails", async () => {
    const intake = parseBuyLaterIntake({ url: "https://example.com/product" });
    await expect(enrichBuyLaterIntake(intake, async () => null)).resolves.toBe(intake);
    await expect(enrichBuyLaterIntake(intake, async () => Promise.reject(new Error("timeout")))).resolves.toBe(intake);
  });

  it("does not request metadata when no URL is present", async () => {
    const intake = parseBuyLaterIntake({});
    const fetchMetadata = vi.fn();
    await expect(enrichBuyLaterIntake(intake, fetchMetadata)).resolves.toBe(intake);
    expect(fetchMetadata).not.toHaveBeenCalled();
  });
});
