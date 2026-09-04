"use client";

import { useFormStatus } from "react-dom";

import type { FindItActionState } from "../types";

type SubmitButtonProps = Readonly<{
  label: string;
  pendingLabel: string;
  tone?: "primary" | "danger";
  disabled?: boolean;
}>;

export function SubmitButton({
  label,
  pendingLabel,
  tone = "primary",
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={tone === "danger" ? "danger-button" : "primary-button"}
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function FormFeedback({ state }: Readonly<{ state: FindItActionState }>) {
  if (!state.message) {
    return null;
  }

  return (
    <p className="form-error" role="alert">
      {state.message}
    </p>
  );
}
