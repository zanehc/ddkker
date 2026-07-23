/**
 * Kakao OAuth2 유틸 (2차 구현)
 * plan_claude.md 섹션 14 참고
 */

const KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize";
const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const KAKAO_USER_URL = "https://kapi.kakao.com/v2/user/me";

export interface KakaoUserInfo {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

export interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

/**
 * Kakao 로그인 URL 생성 (state 포함)
 */
export function getKakaoLoginUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.KAKAO_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/kakao/callback`,
    response_type: "code",
    state,
  });

  return `${KAKAO_AUTH_URL}?${params.toString()}`;
}

/**
 * 인증 코드를 액세스 토큰으로 교환하고 사용자 정보 반환
 */
export async function exchangeKakaoCode(
  code: string
): Promise<{ token: KakaoTokenResponse; user: KakaoUserInfo }> {
  // 토큰 교환
  const tokenRes = await fetch(KAKAO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.KAKAO_CLIENT_ID!,
      client_secret: process.env.KAKAO_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/kakao/callback`,
      code,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`카카오 토큰 교환 실패: ${err}`);
  }

  const token: KakaoTokenResponse = await tokenRes.json();

  // 사용자 정보 조회
  const userRes = await fetch(KAKAO_USER_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error("카카오 사용자 정보 조회 실패");
  }

  const user: KakaoUserInfo = await userRes.json();
  return { token, user };
}
