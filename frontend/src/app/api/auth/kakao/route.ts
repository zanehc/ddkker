import { getKakaoLoginUrl } from "@/lib/auth/kakao";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Kakao 로그인 시작 (2차 구현)
 * state cookie를 설정하고 카카오 인증 페이지로 리다이렉트
 */
export async function GET(request: NextRequest) {
  // CSRF 방지용 state 생성
  const state = crypto.randomBytes(16).toString("hex");

  const loginUrl = getKakaoLoginUrl(state);

  const response = NextResponse.redirect(loginUrl);

  // state를 httpOnly secure 쿠키에 저장 (10분 유효)
  response.cookies.set("kakao_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  // next 파라미터 저장 (로그인 후 돌아갈 경로)
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  response.cookies.set("kakao_oauth_next", next, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
