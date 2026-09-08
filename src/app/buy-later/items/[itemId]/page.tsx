import type { Metadata } from "next";
import { BuyLaterConfigurationRequired, BuyLaterItemScreen, requireBuyLaterUser } from "@/modules/buy-later";

export const metadata: Metadata = { title: "Item · Buy Later" };
export const dynamic = "force-dynamic";

export default async function BuyLaterItemPage({ params, searchParams }: Readonly<{ params: Promise<{ itemId: string }>; searchParams: Promise<{ notice?: string }> }>) {
  const { itemId } = await params;
  const user = await requireBuyLaterUser(`/buy-later/items/${itemId}`);
  if (!user) return <BuyLaterConfigurationRequired />;
  return <BuyLaterItemScreen itemId={itemId} notice={(await searchParams).notice} userId={user.id} />;
}
