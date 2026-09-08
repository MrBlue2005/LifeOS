export type PriceResult =
  | Readonly<{ success: true; value: string }>
  | Readonly<{ success: false; message: string }>;

export function normalizePrice(value: string): PriceResult {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(normalized)) {
    return { success: false, message: "Enter a valid price with up to two decimal places." };
  }
  const [whole, fraction = ""] = normalized.split(".");
  const canonicalWhole = whole.replace(/^0+(?=\d)/, "");
  const canonical = `${canonicalWhole}.${fraction.padEnd(2, "0")}`;
  return { success: true, value: canonical };
}

export function formatPrice(value: string, currency: string): string {
  const [whole, fraction = "00"] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currency} ${grouped}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}
