import { normalizeProductUrl } from "./url";

type QueryValue = string | string[] | undefined;

export type BuyLaterIntakeQuery = Readonly<{
  url?: QueryValue;
  title?: QueryValue;
  text?: QueryValue;
}>;

export type BuyLaterIntake = Readonly<{
  initialValues: Readonly<{
    name: string;
    productUrl: string;
    note: string;
  }>;
  invalidFields: readonly ("url" | "title" | "text")[];
  returnPath: string;
}>;

function firstValue(value: QueryValue): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseBuyLaterIntake(query: BuyLaterIntakeQuery): BuyLaterIntake {
  const rawUrl = firstValue(query.url);
  const rawTitle = firstValue(query.title);
  const rawText = firstValue(query.text);
  const productUrl = rawUrl.length <= 2048 ? normalizeProductUrl(rawUrl) : null;
  const name = rawTitle.length <= 160 ? rawTitle : "";
  const note = rawText.length <= 1000 ? rawText : "";
  const invalidFields: ("url" | "title" | "text")[] = [];

  if (rawUrl && !productUrl) invalidFields.push("url");
  if (rawTitle && !name) invalidFields.push("title");
  if (rawText && !note) invalidFields.push("text");

  const safeParams = new URLSearchParams();
  if (productUrl) safeParams.set("url", productUrl);
  if (name) safeParams.set("title", name);
  if (note) safeParams.set("text", note);

  const queryString = safeParams.toString();
  return {
    initialValues: { name, productUrl: productUrl ?? "", note },
    invalidFields,
    returnPath: `/buy-later/import${queryString ? `?${queryString}` : ""}`,
  };
}
