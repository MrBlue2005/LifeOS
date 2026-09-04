import Link from "next/link";
import type { ReactNode } from "react";

import { moduleRegistry } from "@/core/modules/registry";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand-link" href="/" aria-label="RX LifeOS home">
          <span className="brand-mark" aria-hidden="true">
            RX
          </span>
          <span>RX LifeOS</span>
        </Link>

        <nav className="module-nav" aria-label="RX LifeOS modules">
          {moduleRegistry.map((moduleDefinition) => (
            <Link href={moduleDefinition.href} key={moduleDefinition.id}>
              {moduleDefinition.name}
            </Link>
          ))}
        </nav>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">RX LifeOS · Built for everyday clarity.</footer>
    </div>
  );
}
