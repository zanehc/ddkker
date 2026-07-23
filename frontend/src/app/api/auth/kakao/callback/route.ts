import { exchangeKakaoCode } from "@/lib/auth/kakao";
import { adminClient } from "@/lib/server/admin-client";
import { NextRequest, NextResponse } from "next/server";

/**
 * Kakao OAuth 콜백 (2차 구현)
 * service role로 사용자 생성/조회 후 Supabase 세션 생성
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // state 쿠키 검증 (CSRF 방지)
  const savedState = request.cookies.get("kakao_oauth_state")?.value;
  const next = request.cookies.get("kakao_oauth_next")?.value ?? "/";

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${origin}/?error=kakao_state_mismatch`);
  }

  try {
    const { user: kakaoUser } = await exchangeKakaoCode(code);

    const kakaoId = kakaoUser.id.toString();
    const kakaoEmail = kakaoUser.kakao_account?.email;
    const displayName = kakaoUser.kakao_account?.profile?.nickname ?? "카카오 사용자";
    const avatarUrl = kakaoUser.kakao_account?.profile?.profile_image_url ?? null;

    // 내부 이메일: 실제 이메일이 없으면 가짜 이메일 사용
    const internalEmail = kakaoEmail ?? `kakao_${kakaoId}@ddkker.local`;

    // service role로 기존 사용자 조회 또는 생성
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === internalEmail
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // 신규 사용자 생성
      const { data: newUser, error: createError } =
        await adminClient.auth.admin.createUser({
          email: internalEmail,
          email_confirm: true,
          user_metadata: {
            full_name: displayName,
            avatar_url: avatarUrl,
            provider: "kakao",
            kakao_id: kakaoId,
          },
        });

      if (createError || !newUser.user) {
        throw new Error(`카카오 사용자 생성 실패: ${createError?.message}`);
      }

      userId = newUser.user.id;
    }

    // 프로필 upsert
    await adminClient.from("profiles").upsert(
      {
        id: userId,
        display_name: displayName,
        avatar_url: avatarUrl,
        provider: "kakao",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    // 매직 링크로 세션 생성 (service role로 토큰 발급)
    const { data: sessionData, error: sessionError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: internalEmail,
      });

    if (sessionError || !sessionData) {
      throw new Error("세션 생성 실패");
    }

    // 쿠키 정리 후 리다이렉트
    const response = NextResponse.redirect(
      `${origin}/auth/callback?code=${encodeURIComponent(sessionData.properties?.hashed_token ?? "")}&next=${encodeURIComponent(next)}`
    );

    response.cookies.delete("kakao_oauth_state");
    response.cookies.delete("kakao_oauth_next");

    return response;
  } catch (error) {
    console.error("카카오 콜백 오류:", error);
    return NextResponse.redirect(`${origin}/?error=kakao_auth_failed`);
  }
}
