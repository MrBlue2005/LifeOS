import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/core/auth/session";
import type { AuthenticatedUser } from "@/core/auth/types";
import { getSupabasePublicConfig } from "@/core/config/supabase";

export async function requireBuyLaterUser(nextPath: string): Promise<AuthenticatedUser | null> {
  if (!getSupabasePublicConfig()) return null;
  const user = await getAuthenticatedUser();
  if (!user) redirect(`/auth/sign-in?next=${encodeURIComponent(nextPath)}`);
  return user;
}
