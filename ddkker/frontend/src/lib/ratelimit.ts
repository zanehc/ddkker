import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();

/**
 * 자료 다운로드 rate limit — 1시간에 10회
 */
export const downloadRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "rl:download",
});

/**
 * 게시글 작성 rate limit — 10분에 5건
 */
export const postRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "rl:post",
});

/**
 * Rate limit을 확인하고, 초과 시 429 응답을 반환합니다.
 * @returns null — 통과, NextResponse — 거부
 */
export async function checkRateLimit(
  req: NextRequest,
  limiter: Ratelimit
): Promise<NextResponse | null> {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await limiter.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }
  return null;
}
