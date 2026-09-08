import { isValidDateString, todayDateString } from "./dates";
import { normalizePrice } from "./money";
import { normalizeProductUrl } from "./url";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return uuidPattern.test(value);
}

export type BuyLaterInput = Readonly<{
  name: string;
  productUrl: string | null;
  currentPrice: string | null;
  currency: string | null;
  note: string | null;
  reconsiderAt: string;
}>;

type ValidationResult<T> =
  | Readonly<{ success: true; data: T }>
  | Readonly<{
      success: false;
      message: string;
      values: Readonly<Record<string, string>>;
      fields: Readonly<Record<string, string>>;
    }>;

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function validateBuyLaterInput(
  formData: FormData,
  options: Readonly<{ allowPastDate?: boolean; today?: string }> = {},
): ValidationResult<BuyLaterInput> {
  const name = readText(formData, "name");
  const rawUrl = readText(formData, "productUrl");
  const rawPrice = readText(formData, "currentPrice");
  const rawCurrency = readText(formData, "currency").toUpperCase();
  const note = readText(formData, "note");
  const reconsiderAt = readText(formData, "reconsiderAt");
  const values = { name, productUrl: rawUrl, currentPrice: rawPrice, currency: rawCurrency, note, reconsiderAt };
  const fields: Record<string, string> = {};

  if (!name) fields.name = "Item name is required.";
  else if (name.length > 160) fields.name = "Item name must be 160 characters or fewer.";

  const productUrl = rawUrl ? normalizeProductUrl(rawUrl) : null;
  if (rawUrl.length > 2048) fields.productUrl = "Product URL must be 2,048 characters or fewer.";
  else if (rawUrl && !productUrl) fields.productUrl = "Enter a valid http or https product URL.";

  let currentPrice: string | null = null;
  if (rawPrice || rawCurrency) {
    if (!rawPrice) fields.currentPrice = "Enter a price or clear the currency.";
    if (!/^[A-Z]{3}$/.test(rawCurrency)) fields.currency = "Use a three-letter currency code, such as RON or EUR.";
    if (rawPrice) {
      const price = normalizePrice(rawPrice);
      if (!price.success) fields.currentPrice = price.message;
      else currentPrice = price.value;
    }
  }

  if (note.length > 1000) fields.note = "Note must be 1,000 characters or fewer.";
  if (!isValidDateString(reconsiderAt)) fields.reconsiderAt = "Choose a valid reconsideration date.";
  else if (!options.allowPastDate && reconsiderAt < (options.today ?? todayDateString())) {
    fields.reconsiderAt = "Choose today or a future date.";
  }

  if (Object.keys(fields).length) {
    return { success: false, message: "Check the highlighted fields.", values, fields };
  }

  return {
    success: true,
    data: {
      name,
      productUrl,
      currentPrice,
      currency: currentPrice ? rawCurrency : null,
      note: note || null,
      reconsiderAt,
    },
  };
}

export function validateNewReconsiderationDate(
  formData: FormData,
  today = todayDateString(),
): ValidationResult<string> {
  const value = readText(formData, "reconsiderAt");
  const values = { reconsiderAt: value };
  if (!isValidDateString(value) || value <= today) {
    return {
      success: false,
      message: "Choose a new date after today.",
      values,
      fields: { reconsiderAt: "Choose a new date after today." },
    };
  }
  return { success: true, data: value };
}
