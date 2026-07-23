import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { adminClient } from "@/lib/server/admin-client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

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

      return response;
    }
  }

  // 오류 발생 시 홈으로 리다이렉트
  return NextResponse.redirect(`${origin}/?error=auth`);
}
