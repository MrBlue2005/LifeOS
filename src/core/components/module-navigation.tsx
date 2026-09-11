"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { LifeOSModuleDefinition } from "@/core/modules/module-definition";

type ModuleNavigationProps = Readonly<{
  modules: readonly LifeOSModuleDefinition[];
}>;

export function ModuleNavigation({ modules }: ModuleNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="module-nav" aria-label="RX LifeOS modules">
      {modules.map((moduleDefinition) => {
        const isActive =
          pathname === moduleDefinition.href ||
          pathname.startsWith(`${moduleDefinition.href}/`);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            href={moduleDefinition.href}
            key={moduleDefinition.id}
          >
            {moduleDefinition.name}
          </Link>
        );
      })}
    </nav>
  );
}
