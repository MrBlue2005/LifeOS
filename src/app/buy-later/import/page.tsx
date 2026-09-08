import type { Metadata } from "next";
import {
  BuyLaterConfigurationRequired,
  BuyLaterImportScreen,
  parseBuyLaterIntake,
  requireBuyLaterUser,
  type BuyLaterIntakeQuery,
} from "@/modules/buy-later";
import { enrichBuyLaterIntake } from "@/modules/buy-later/metadata/enrich-intake";

export const metadata: Metadata = { title: "Save to Buy Later" };
export const dynamic = "force-dynamic";

export default async function BuyLaterImportPage({
  searchParams,
}: Readonly<{ searchParams: Promise<BuyLaterIntakeQuery> }>) {
  const intake = parseBuyLaterIntake(await searchParams);
  const user = await requireBuyLaterUser(intake.returnPath);
  if (!user) return <BuyLaterConfigurationRequired />;
  const enrichedIntake = await enrichBuyLaterIntake(intake);
  return <BuyLaterImportScreen intake={enrichedIntake} />;
}
