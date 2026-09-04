import { cache } from "react";

import { getSupabasePublicConfig } from "@/core/config/supabase";
import { createSupabaseServerClient } from "@/core/supabase/server";
import type { AuthenticatedUser } from "./types";

export const getAuthenticatedUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    if (!getSupabasePublicConfig()) {
      return null;
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;
    const subject = claims?.sub;

    if (error || !claims || typeof subject !== "string") {
      return null;
    }

    const email = claims.email;

    return {
      id: subject,
      email: typeof email === "string" ? email : null,
    };
  },
);
