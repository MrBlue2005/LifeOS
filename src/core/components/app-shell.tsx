import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/core/auth/actions";
import { getAuthenticatedUser } from "@/core/auth/session";
import { moduleRegistry } from "@/core/modules/registry";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export async function AppShell({ children }: AppShellProps) {
  const user = await getAuthenticatedUser();

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand-link" href="/" aria-label="RX LifeOS home">
          <span className="brand-mark" aria-hidden="true">
            RX
          </span>
          <span>RX LifeOS</span>
        </Link>

        <div className="header-actions">
          <nav className="module-nav" aria-label="RX LifeOS modules">
            {moduleRegistry.map((moduleDefinition) => (
              <Link href={moduleDefinition.href} key={moduleDefinition.id}>
                {moduleDefinition.name}
              </Link>
            ))}
          </nav>

          {user ? (
            <form action={signOutAction}>
              <button className="quiet-button" type="submit">
                Sign out
              </button>
            </form>
          ) : (
            <Link className="quiet-button" href="/auth/sign-in">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">RX LifeOS · Built for everyday clarity.</footer>
    </div>
  );
}
