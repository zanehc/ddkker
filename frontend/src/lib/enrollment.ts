/**
 * 수강권 만료 정책 헬퍼.
 *
 * 수강권은 구매 시각으로부터 `courses.access_months`(기본 12개월) 동안 유효하다.
 * `expires_at = null` 은 무기한(기존 "영구 수강" 구매자, 관리자 수동 부여)을 뜻한다.
 */

export const DEFAULT_ACCESS_MONTHS = 12;

/**
 * 구매 시각 + 수강 개월 수 → 만료 시각(ISO).
 * accessMonths 가 null/0 이하면 무기한으로 보고 null 을 돌려준다.
 *
 * 말일 보정: 1/31 + 1개월이 3/3 으로 넘어가지 않고 2/28(29)이 되게 한다.
 */
export function computeExpiresAt(
  accessMonths: number | null | undefined,
  from: Date = new Date()
): string | null {
  if (accessMonths == null || accessMonths <= 0) return null;

  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + accessMonths);
  if (d.getUTCDate() < day) d.setUTCDate(0);

  return d.toISOString();
}

/**
 * enrollments 조회에 붙일 Supabase `.or()` 필터.
 * 만료되지 않은 수강권(무기한 포함)만 남긴다.
 *
 *   .eq("status", "active").or(activeEnrollmentFilter())
 */
export function activeEnrollmentFilter(now: Date = new Date()): string {
  return `expires_at.is.null,expires_at.gt.${now.toISOString()}`;
}

/** 만료 여부. expires_at 이 null 이면 무기한이므로 항상 false. */
export function isExpired(
  expiresAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}

/** 남은 일수. 무기한이면 null, 이미 만료면 0. */
export function daysLeft(
  expiresAt: string | null | undefined,
  now: Date = new Date()
): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}
