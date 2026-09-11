import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/core/auth/auth-form";
import { getSafeRedirectPath } from "@/core/auth/redirect";
import { getAuthenticatedUser } from "@/core/auth/session";
import { ConfigurationRequired } from "@/core/components/configuration-required";
import { getSupabasePublicConfig } from "@/core/config/supabase";

export const metadata: Metadata = {
  title: "Sign in",
};

type SignInPageProps = Readonly<{
  searchParams: Promise<{
    confirmation?: string;
    configuration?: string;
    next?: string;
  }>;
}>;

export default async function SignInPage({ searchParams }: SignInPageProps) {
  if (!getSupabasePublicConfig()) {
    return <ConfigurationRequired />;
  }

  const params = await searchParams;
  const nextPath = params.next ? getSafeRedirectPath(params.next) : undefined;
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(nextPath ?? "/find-it");
  }

  return (
    <section className="auth-panel" aria-labelledby="sign-in-title">
      <p className="eyebrow">Welcome back</p>
      <h1 id="sign-in-title">Sign in to RX LifeOS</h1>
      <p className="placeholder-copy">
        Your Find It locations and items stay private to your account.
      </p>
      {params.confirmation === "failed" ? (
        <p className="form-error" role="alert">
          That confirmation link is invalid or has expired. Request a new sign-up
          email or try signing in.
        </p>
      ) : null}
      {params.configuration === "missing" ? (
        <p className="form-error" role="alert">
          Supabase is not configured for this environment.
        </p>
      ) : null}
      <AuthForm mode="sign-in" nextPath={nextPath} />
    </section>
  );
}
