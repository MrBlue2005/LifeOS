import type { Metadata } from "next";
import { BuyLaterConfigurationRequired, NewBuyLaterItemScreen, requireBuyLaterUser } from "@/modules/buy-later";

export const metadata: Metadata = { title: "Save an item · Buy Later" };
export const dynamic = "force-dynamic";

export default async function NewBuyLaterItemPage() {
  const user = await requireBuyLaterUser("/buy-later/items/new");
  if (!user) return <BuyLaterConfigurationRequired />;
  return <NewBuyLaterItemScreen />;
}
