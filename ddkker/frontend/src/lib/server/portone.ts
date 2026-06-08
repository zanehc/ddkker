import "server-only";
import crypto from "crypto";

/**
 * 포트원(PortOne V2) 서버 연동 — 결제 단건 조회 + 웹훅 서명 검증.
 *
 * 키는 전부 서버 전용. 클라이언트에는 STORE_ID / CHANNEL_KEY(NEXT_PUBLIC_*)만 노출한다.
 * 스캐폴딩: 키 미설정 시 isPortoneConfigured()=false. 실제 호출은 키 주입 후 동작.
 *
 * ⚠️ 실서비스 전환 전 포트원 공식 문서로 (1) 결제조회 응답 필드(status, amount.total)
 *    (2) 웹훅 서명 헤더/스킴을 반드시 재확인할 것.
 */

const PORTONE_API = "https://api.portone.io";

export function getPortoneApiSecret(): string | null {
  return process.env.PORTONE_API_SECRET || null;
}

export function getPortoneWebhookSecret(): string | null {
  return process.env.PORTONE_WEBHOOK_SECRET || null;
}

/** 서버 결제 검증에 필요한 키가 모두 있는지 */
export function isPortoneConfigured(): boolean {
  return Boolean(getPortoneApiSecret());
}

export interface PortonePayment {
  status: string; // 'PAID' | 'CANCELLED' | 'FAILED' | ...
  amount: { total: number };
  orderName?: string;
  customData?: string | Record<string, unknown>;
  // 원본 전체 (payments.raw 저장용)
  raw: Record<string, unknown>;
}

/**
 * 포트원 결제 단건 조회. 프론트 콜백을 신뢰하지 않고 서버가 직접 재조회한다.
 * 실패 시 throw.
 */
export async function getPortonePayment(paymentId: string): Promise<PortonePayment> {
  const secret = getPortoneApiSecret();
  if (!secret) throw new Error("PORTONE_API_SECRET 미설정");

  const res = await fetch(
    `${PORTONE_API}/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: { Authorization: `PortOne ${secret}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`포트원 결제조회 실패 (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const amount = (data.amount ?? {}) as { total?: number };

  return {
    status: String(data.status ?? ""),
    amount: { total: Number(amount.total ?? 0) },
    orderName: data.orderName as string | undefined,
    customData: data.customData as PortonePayment["customData"] | undefined,
    raw: data,
  };
}

/**
 * 웹훅 서명 검증 (Standard Webhooks 스킴).
 *   서명 대상 = `${webhook-id}.${webhook-timestamp}.${rawBody}`
 *   key = base64decode(secret without 'whsec_' prefix)
 *   sig = base64( HMAC-SHA256(key, signedContent) )
 * webhook-signature 헤더는 "v1,<sig> v1,<sig2>" 형태일 수 있어 공백 분리 후 하나라도 일치하면 통과.
 * 검증 실패 시 false.
 */
export function verifyPortoneWebhook(
  rawBody: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null }
): boolean {
  const secret = getPortoneWebhookSecret();
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) {
    return false;
  }

  const keyB64 = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(keyB64, "base64");
  } catch {
    return false;
  }

  const signedContent = `${headers.id}.${headers.timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", key)
    .update(signedContent)
    .digest("base64");

  const expectedBuf = Buffer.from(expected);
  return headers.signature.split(" ").some((part) => {
    const sig = part.includes(",") ? part.split(",")[1] : part;
    const sigBuf = Buffer.from(sig);
    return (
      sigBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(sigBuf, expectedBuf)
    );
  });
}
