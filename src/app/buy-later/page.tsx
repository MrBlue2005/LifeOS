import type { Metadata } from "next";

import { ModulePlaceholder } from "@/core/components/module-placeholder";
import { buyLaterModule } from "@/modules/buy-later";

export const metadata: Metadata = {
  title: buyLaterModule.name,
  description: buyLaterModule.description,
};

export default function BuyLaterPage() {
  return (
    <ModulePlaceholder
      moduleDefinition={buyLaterModule}
      phaseNote="Buy Later is planned after the Find It MVP. Purchase and reconsideration features are not implemented yet."
    />
  );
}
