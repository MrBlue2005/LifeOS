"use client";

import { useFormStatus } from "react-dom";
import type { BuyLaterActionState } from "../types";

export function BuyLaterSubmitButton({
  label, pendingLabel, tone = "primary", disabled = false,
}: Readonly<{
  label: string; pendingLabel: string; tone?: "primary" | "secondary" | "danger"; disabled?: boolean;
}>) {
  const { pending } = useFormStatus();
  const className = tone === "danger" ? "danger-button" : tone === "secondary" ? "secondary-button" : "primary-button";
  return <button className={className} disabled={disabled || pending} type="submit">{pending ? pendingLabel : label}</button>;
}

export function BuyLaterFeedback({ state }: Readonly<{ state: BuyLaterActionState }>) {
  return state.message ? <p className="form-error" role="alert">{state.message}</p> : null;
}
