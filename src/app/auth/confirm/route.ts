import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicConfig } from "@/core/config/supabase";
import { createSupabaseServerClient } from "@/core/supabase/server";

const allowedOtpTypes = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

export async function GET(request: NextRequest) {
  if (!getSupabasePublicConfig()) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?configuration=missing", request.url),
    );
  }

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (tokenHash && type && allowedOtpTypes.has(type as EmailOtpType)) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (!error) {
      return NextResponse.redirect(new URL("/find-it", request.url));
    }
  }

  return NextResponse.redirect(
    new URL("/auth/sign-in?confirmation=failed", request.url),
  );
}
