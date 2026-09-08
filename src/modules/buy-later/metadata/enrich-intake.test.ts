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

  it("uses the local URL slug only after metadata has no title", async () => {
    const intake = parseBuyLaterIntake({ url: "https://shop.example/portable-reading-lamp" });
    await expect(enrichBuyLaterIntake(intake, async () => ({ title: "Fetched title" }))).resolves.toMatchObject({
      initialValues: { name: "Fetched title" },
    });
    await expect(enrichBuyLaterIntake(intake, async () => null)).resolves.toMatchObject({
      initialValues: { name: "Portable reading lamp" },
    });
  });

  it("uses the eMAG-style URL path after a metadata failure", async () => {
    const intake = parseBuyLaterIntake({
      url: "https://www.emag.ro/set-de-constructie-bedeer-nava-de-lupta-missouri-2228pcs-82-5-x-24-5-x-10-1-cm-cu-o-baza-frumoasa-perfecta-pentru-a-fi-oferita-cadou-pasionatilor-si-entuziastilor-militari-cu-varsta-de-14-ani-si-peste/pd/DT5BMW3BM/",
    });
    await expect(enrichBuyLaterIntake(intake, async () => Promise.reject(new Error("blocked")))).resolves.toMatchObject({
      initialValues: {
        name: "Set de constructie bedeer nava de lupta missouri 2228pcs 82 5 x 24 5 x 10 1 cm cu o baza frumoasa perfecta pentru a fi oferita cadou pasionatilor si",
      },
    });
  });

  it("leaves the editable intake empty when metadata fails and no slug is plausible", async () => {
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
