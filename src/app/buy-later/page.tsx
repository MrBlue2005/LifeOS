import type { Metadata } from "next";
import { BuyLaterConfigurationRequired, BuyLaterHomeScreen, buyLaterModule, requireBuyLaterUser } from "@/modules/buy-later";

export const metadata: Metadata = { title: buyLaterModule.name, description: buyLaterModule.description };
export const dynamic = "force-dynamic";

export default async function BuyLaterPage({ searchParams }: Readonly<{ searchParams: Promise<{ notice?: string }> }>) {
  const user = await requireBuyLaterUser("/buy-later");
  if (!user) return <BuyLaterConfigurationRequired />;
  return <BuyLaterHomeScreen notice={(await searchParams).notice} userId={user.id} />;
}
