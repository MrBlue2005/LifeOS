import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/core/auth/actions";
import { getAuthenticatedUser } from "@/core/auth/session";
import { ModuleNavigation } from "@/core/components/module-navigation";
import { moduleRegistry } from "@/core/modules/registry";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export async function AppShell({ children }: AppShellProps) {
  const user = await getAuthenticatedUser();

  return (
    <div className="site-shell">
      <header
        className={`site-header ${user ? "site-header-authenticated" : "site-header-guest"}`}
      >
        <Link className="brand-link" href="/" aria-label="RX LifeOS home">
          <span className="brand-mark" aria-hidden="true">
            RX
          </span>
          <span className="brand-name">RX LifeOS</span>
        </Link>

        <div className="header-actions">
          <ModuleNavigation modules={moduleRegistry} />

          {user ? (
            <form className="account-action" action={signOutAction}>
              <button className="quiet-button" type="submit">
                Sign out
              </button>
            </form>
          ) : (
            <nav className="auth-nav" aria-label="Account">
              <Link className="quiet-button" href="/auth/sign-in">
                Sign in
              </Link>
              <Link className="account-create-link" href="/auth/sign-up">
                Create account
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <strong>RX LifeOS</strong>
        <span>Built for everyday clarity.</span>
      </footer>
    </div>
  );
}
