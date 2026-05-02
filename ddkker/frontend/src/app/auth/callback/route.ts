import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/server/admin-client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;

      // 프로필 upsert (trigger 실패 시 폴백)
      const displayName =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email ??
        "사용자";

      await adminClient.from("profiles").upsert(
        {
          id: user.id,
          display_name: displayName,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          provider: "google",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 오류 발생 시 홈으로 리다이렉트
  return NextResponse.redirect(`${origin}/?error=auth`);
}
