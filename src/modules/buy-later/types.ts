export type BuyLaterStatus = "considering" | "purchased" | "dismissed";

export type BuyLaterItem = Readonly<{
  id: string;
  userId: string;
  name: string;
  productUrl: string | null;
  currentPrice: string | null;
  currency: string | null;
  note: string | null;
  reconsiderAt: string;
  status: BuyLaterStatus;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type BuyLaterActionState = Readonly<{
  status: "idle" | "error";
  message: string;
  values: Readonly<Record<string, string>>;
  fields: Readonly<Record<string, string>>;
}>;

export const initialBuyLaterActionState: BuyLaterActionState = {
  status: "idle",
  message: "",
  values: {},
  fields: {},
};
