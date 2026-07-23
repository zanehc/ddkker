import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

/**
 * Upstash Redis는 선택 의존성이다. 환경변수가 없으면 rate limit을 건너뛴다(fail-open).
 * (미설정 시 Redis.fromEnv()가 throw → 라우트 전체가 500 나던 문제 방지)
 */
const hasRedis = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);
const redis = hasRedis ? Redis.fromEnv() : null;

/**
 * 자료 다운로드 rate limit — 1시간에 10회
 */
export const downloadRatelimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 h"), prefix: "rl:download" })
  : null;

/**
 * 게시글 작성 rate limit — 10분에 5건
 */
export const postRatelimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "10 m"), prefix: "rl:post" })
  : null;

/**
 * 외주 의뢰 접수 rate limit — 10분에 3건
 */
export const inquiryRatelimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "10 m"), prefix: "rl:inquiry" })
  : null;

/**
 * Rate limit을 확인하고, 초과 시 429 응답을 반환합니다.
 * limiter가 null(Redis 미설정)이거나 오류 시에는 통과시킵니다(fail-open).
 * @returns null — 통과, NextResponse — 거부
 */
export async function checkRateLimit(
  req: NextRequest,
  limiter: Ratelimit | null
): Promise<NextResponse | null> {
  if (!limiter) return null; // Redis 미설정 → rate limit 건너뜀
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const { success } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
    return null;
  } catch {
    // Redis 연결 오류 등 — 접수 자체는 막지 않는다(fail-open)
    return null;
  }
}
