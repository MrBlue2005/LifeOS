"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  signInAction,
  signUpAction,
} from "@/core/auth/actions";
import { initialAuthActionState } from "@/core/auth/types";

type AuthFormProps = Readonly<{
  mode: "sign-in" | "sign-up";
  nextPath?: string;
}>;

function authPath(path: "/auth/sign-in" | "/auth/sign-up", nextPath?: string) {
  return nextPath ? `${path}?next=${encodeURIComponent(nextPath)}` : path;
}

function SubmitButton({ label }: Readonly<{ label: string }>) {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? "Working…" : label}
    </button>
  );
}

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const action = mode === "sign-in" ? signInAction : signUpAction;
  const [state, formAction] = useActionState(action, initialAuthActionState);
  const isSignIn = mode === "sign-in";

  return (
    <form className="form-stack" action={formAction}>
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      <label className="field">
        <span>Email</span>
        <input
          autoComplete="email"
          autoFocus
          defaultValue={state.email}
          inputMode="email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          autoComplete={isSignIn ? "current-password" : "new-password"}
          maxLength={128}
          minLength={6}
          name="password"
          required
          type="password"
        />
      </label>

      {state.message ? (
        <p
          className={state.status === "error" ? "form-error" : "form-success"}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton label={isSignIn ? "Sign in" : "Create account"} />

      <p className="form-switch">
        {isSignIn ? "New to RX LifeOS?" : "Already have an account?"}{" "}
        <Link
          href={authPath(
            isSignIn ? "/auth/sign-up" : "/auth/sign-in",
            nextPath,
          )}
        >
          {isSignIn ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
