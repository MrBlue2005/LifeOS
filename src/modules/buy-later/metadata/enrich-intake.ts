import type { BuyLaterIntake } from "../domain/intake";
import { deriveTitleFromUrlPath } from "./derive-title-from-url-path";
import { fetchProductMetadata, type ProductMetadata } from "./fetch-product-metadata";

type MetadataFetcher = (url: string) => Promise<ProductMetadata | null>;

export async function enrichBuyLaterIntake(
  intake: BuyLaterIntake,
  fetchMetadata: MetadataFetcher = fetchProductMetadata,
): Promise<BuyLaterIntake> {
  if (intake.initialValues.name || !intake.initialValues.productUrl) return intake;

  let title: string | null = null;
  try {
    title = (await fetchMetadata(intake.initialValues.productUrl))?.title ?? null;
  } catch {
    // Metadata failure intentionally falls back to local URL-path parsing.
  }

  title ??= deriveTitleFromUrlPath(intake.initialValues.productUrl) ?? null;
  if (!title) return intake;

  return {
    ...intake,
    initialValues: { ...intake.initialValues, name: title },
  };
}
