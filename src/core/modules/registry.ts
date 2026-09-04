import type { LifeOSModuleDefinition } from "./module-definition";
import { buyLaterModule } from "@/modules/buy-later";
import { findItModule } from "@/modules/find-it";

export function createModuleRegistry(
  modules: readonly LifeOSModuleDefinition[],
): readonly LifeOSModuleDefinition[] {
  const ids = new Set<string>();
  const routes = new Set<string>();

  for (const moduleDefinition of modules) {
    if (ids.has(moduleDefinition.id)) {
      throw new Error(`Duplicate module ID: ${moduleDefinition.id}`);
    }

    if (routes.has(moduleDefinition.href)) {
      throw new Error(`Duplicate module route: ${moduleDefinition.href}`);
    }

    ids.add(moduleDefinition.id);
    routes.add(moduleDefinition.href);
  }

  return Object.freeze([...modules]);
}

export const moduleRegistry = createModuleRegistry([
  findItModule,
  buyLaterModule,
]);
