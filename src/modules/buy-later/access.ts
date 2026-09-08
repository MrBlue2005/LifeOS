import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/core/auth/session";
import { getSafeRedirectPath } from "@/core/auth/redirect";
import type { AuthenticatedUser } from "@/core/auth/types";
import { getSupabasePublicConfig } from "@/core/config/supabase";

export async function requireBuyLaterUser(nextPath: string): Promise<AuthenticatedUser | null> {
  if (!getSupabasePublicConfig()) return null;
  const user = await getAuthenticatedUser();
  if (!user) {
    const safeNextPath = getSafeRedirectPath(nextPath, "/buy-later");
    redirect(`/auth/sign-in?next=${encodeURIComponent(safeNextPath)}`);
  }
  return user;
}
