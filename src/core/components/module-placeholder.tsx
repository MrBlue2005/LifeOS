import Link from "next/link";

import type { LifeOSModuleDefinition } from "@/core/modules/module-definition";

type ModulePlaceholderProps = Readonly<{
  moduleDefinition: LifeOSModuleDefinition;
  phaseNote: string;
}>;

export function ModulePlaceholder({
  moduleDefinition,
  phaseNote,
}: ModulePlaceholderProps) {
  return (
    <section className="placeholder" aria-labelledby="module-title">
      <p className="eyebrow">Module foundation</p>
      <h1 id="module-title">{moduleDefinition.name}</h1>
      <p className="placeholder-copy">{moduleDefinition.description}</p>
      <p className="placeholder-note">{phaseNote}</p>
      <Link className="back-link" href="/">
        Return to RX LifeOS
      </Link>
    </section>
  );
}
