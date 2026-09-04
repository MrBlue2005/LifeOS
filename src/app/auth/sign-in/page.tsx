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
  searchParams: Promise<{ next?: string }>;
}>;

export default async function SignInPage({ searchParams }: SignInPageProps) {
  if (!getSupabasePublicConfig()) {
    return <ConfigurationRequired />;
  }

  const nextPath = getSafeRedirectPath((await searchParams).next);
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(nextPath);
  }

  return (
    <section className="auth-panel" aria-labelledby="sign-in-title">
      <p className="eyebrow">Welcome back</p>
      <h1 id="sign-in-title">Sign in to RX LifeOS</h1>
      <p className="placeholder-copy">
        Your Find It locations and items stay private to your account.
      </p>
      <AuthForm mode="sign-in" nextPath={nextPath} />
    </section>
  );
}
