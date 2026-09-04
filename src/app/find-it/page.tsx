import type { Metadata } from "next";

import { ModulePlaceholder } from "@/core/components/module-placeholder";
import { findItModule } from "@/modules/find-it";

export const metadata: Metadata = {
  title: findItModule.name,
  description: findItModule.description,
};

export default function FindItPage() {
  return (
    <ModulePlaceholder
      moduleDefinition={findItModule}
      phaseNote="Find It will be the first fully implemented RX LifeOS module. Object and location features begin in Phase 1."
    />
  );
}
