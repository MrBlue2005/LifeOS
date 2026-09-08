import type { LifeOSModuleDefinition } from "@/core/modules/module-definition";

export const buyLaterModule = {
  id: "buy-later",
  name: "Buy Later",
  description: "Save it now. Decide later.",
  href: "/buy-later",
  status: "available",
} satisfies LifeOSModuleDefinition;

export { requireBuyLaterUser } from "./access";
export {
  BuyLaterConfigurationRequired,
  BuyLaterHistoryScreen,
  BuyLaterHomeScreen,
  BuyLaterItemScreen,
  NewBuyLaterItemScreen,
} from "./screens";
