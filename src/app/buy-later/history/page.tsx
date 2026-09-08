import type { Metadata } from "next";
import { BuyLaterConfigurationRequired, BuyLaterHistoryScreen, requireBuyLaterUser } from "@/modules/buy-later";

export const metadata: Metadata = { title: "History · Buy Later" };
export const dynamic = "force-dynamic";

export default async function BuyLaterHistoryPage() {
  const user = await requireBuyLaterUser("/buy-later/history");
  if (!user) return <BuyLaterConfigurationRequired />;
  return <BuyLaterHistoryScreen userId={user.id} />;
}
