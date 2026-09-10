import { createClient } from "@supabase/supabase-js";
import { requireSupabasePublicConfig } from "../config/supabase";
import type { Database } from "./database.types";

export function createSupabaseServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("Notification delivery is not configured.");
  const config = requireSupabasePublicConfig();
  return createClient<Database>(config.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
