import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/core/auth/auth-form";
import { getAuthenticatedUser } from "@/core/auth/session";
import { ConfigurationRequired } from "@/core/components/configuration-required";
import { getSupabasePublicConfig } from "@/core/config/supabase";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function SignUpPage() {
  if (!getSupabasePublicConfig()) {
    return <ConfigurationRequired />;
  }

  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/find-it");
  }

  return (
    <section className="auth-panel" aria-labelledby="sign-up-title">
      <p className="eyebrow">Your private space</p>
      <h1 id="sign-up-title">Create your RX LifeOS account</h1>
      <p className="placeholder-copy">
        Start with Find It and build a reliable map of where things live.
      </p>
      <AuthForm mode="sign-up" />
    </section>
  );
}
