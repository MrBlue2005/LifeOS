"use server";

import { redirect } from "next/navigation";

import { getSupabasePublicConfig } from "@/core/config/supabase";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { getSafeRedirectPath } from "./redirect";
import type { AuthActionState } from "./types";

function readCredentials(formData: FormData):
  | { email: string; password: string }
  | { error: AuthActionState } {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || email.length > 254 || !email.includes("@")) {
    return {
      error: {
        status: "error",
        message: "Enter a valid email address.",
        email,
      },
    };
  }

  if (password.length < 6 || password.length > 128) {
    return {
      error: {
        status: "error",
        message: "Password must be between 6 and 128 characters.",
        email,
      },
    };
  }

  return { email, password };
}

function configurationError(email = ""): AuthActionState {
  return {
    status: "error",
    message: "Supabase is not configured for this environment.",
    email,
  };
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);

  if ("error" in credentials) {
    return credentials.error;
  }

  if (!getSupabasePublicConfig()) {
    return configurationError(credentials.email);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return {
      status: "error",
      message: "We could not sign you in with those credentials.",
      email: credentials.email,
    };
  }

  const nextValue = formData.get("next");
  redirect(
    getSafeRedirectPath(typeof nextValue === "string" ? nextValue : null),
  );
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);

  if ("error" in credentials) {
    return credentials.error;
  }

  if (!getSupabasePublicConfig()) {
    return configurationError(credentials.email);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp(credentials);

  if (error) {
    return {
      status: "error",
      message: "We could not create that account. Check the details and try again.",
      email: credentials.email,
    };
  }

  if (data.session) {
    const nextValue = formData.get("next");
    redirect(
      getSafeRedirectPath(typeof nextValue === "string" ? nextValue : null),
    );
  }

  return {
    status: "success",
    message: "Check your email to confirm your account, then sign in.",
    email: credentials.email,
  };
}

export async function signOutAction(formData: FormData): Promise<void> {
  void formData;

  if (getSupabasePublicConfig()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/auth/sign-in");
}
