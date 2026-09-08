import type { BuyLaterIntake } from "../domain/intake";
import { fetchProductMetadata, type ProductMetadata } from "./fetch-product-metadata";

type MetadataFetcher = (url: string) => Promise<ProductMetadata | null>;

export async function enrichBuyLaterIntake(
  intake: BuyLaterIntake,
  fetchMetadata: MetadataFetcher = fetchProductMetadata,
): Promise<BuyLaterIntake> {
  if (intake.initialValues.name || !intake.initialValues.productUrl) return intake;

  try {
    const metadata = await fetchMetadata(intake.initialValues.productUrl);
    if (!metadata?.title) return intake;
    return {
      ...intake,
      initialValues: { ...intake.initialValues, name: metadata.title },
    };
  } catch {
    return intake;
  }
}
