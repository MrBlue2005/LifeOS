import type { LifeOSModuleDefinition } from "@/core/modules/module-definition";

export const findItModule = {
  id: "find-it",
  name: "Find It",
  description: "Know where everything is.",
  href: "/find-it",
  status: "available",
} satisfies LifeOSModuleDefinition;

export {
  FindItConfigurationRequired,
  FindItHomeScreen,
  ItemDetailScreen,
  LocationsScreen,
  NewItemScreen,
} from "./screens";
export { requireFindItUser } from "./access";
