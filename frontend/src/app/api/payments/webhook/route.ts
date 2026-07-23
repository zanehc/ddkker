import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/server/admin-client";
import {
  getPortonePayment,
  verifyPortoneWebhook,
  isPortoneConfigured,
} from "@/lib/server/portone";
import type { PaymentStatus } from "@/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/webhook  (포트원 → 우리)
 *
 * 1) 서명 검증 (PORTONE_WEBHOOK_SECRET)
 * 2) 이벤트의 paymentId로 포트원 결제를 재조회(권위 있는 상태)
 * 3) status에 따라 payments + enrollments 를 멱등 동기화
 *      PAID                      → payments=paid,     enrollments=active
 *      CANCELLED/PARTIAL_CANCEL  → payments=refunded, enrollments=refunded
 *      FAILED                    → payments=failed
 *
 * /complete 와 동시에 들어와도 payment_id(PK)·UNIQUE(user,course)로 중복 부여되지 않는다.
 */
export async function POST(req: NextRequest) {
  if (!isPortoneConfigured()) {
    return NextResponse.json({ error: "결제 모듈 미설정" }, { status: 503 });
  }

  const rawBody = await req.text();

  // 1) 서명 검증
  const ok = verifyPortoneWebhook(rawBody, {
    id: req.headers.get("webhook-id"),
    timestamp: req.headers.get("webhook-timestamp"),
    signature: req.headers.get("webhook-signature"),
  });
  if (!ok) {
    return NextResponse.json({ error: "서명 검증 실패" }, { status: 400 });
  }

  // 2) paymentId 추출
  let event: { type?: string; data?: { paymentId?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "잘못된 본문" }, { status: 400 });
  }
  const paymentId = event.data?.paymentId;
  if (!paymentId) {
    // 결제 관련 이벤트가 아니면 무시 (200으로 응답해 재전송 방지)
    return NextResponse.json({ ignored: true });
  }

  // 3) 포트원 재조회 (권위 있는 상태)
  let payment;
  try {
    payment = await getPortonePayment(paymentId);
  } catch (e) {
    return NextResponse.json(
      { error: `결제 조회 실패: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  // user/course 해석: 기존 payments 행 우선, 없으면 customData에서
  let userId: string | null = null;
  let courseId: number | null = null;

  const { data: existing } = await adminClient
    .from("payments")
    .select("user_id, course_id")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (existing) {
    userId = existing.user_id;
    courseId = existing.course_id;
  } else if (payment.customData) {
    try {
      const cd = (
        typeof payment.customData === "string"
          ? JSON.parse(payment.customData)
          : payment.customData
      ) as {
        userId?: string;
        courseId?: number;
      };
      userId = cd.userId ?? null;
      courseId = cd.courseId ?? null;
    } catch {
      /* customData 파싱 실패 무시 */
    }
  }

  if (!userId || !courseId) {
    return NextResponse.json(
      { error: "결제에 연결된 사용자/강의를 확인할 수 없습니다" },
      { status: 422 }
    );
  }

  // status 매핑
  const s = payment.status;
  let paymentStatus: PaymentStatus;
  let enrollmentStatus: "active" | "refunded" | null = null;

  if (s === "PAID") {
    paymentStatus = "paid";
    enrollmentStatus = "active";
  } else if (s === "CANCELLED" || s === "PARTIAL_CANCELLED") {
    paymentStatus = "refunded";
    enrollmentStatus = "refunded";
  } else if (s === "FAILED") {
    paymentStatus = "failed";
  } else {
    // READY 등 중간 상태는 기록만 하고 권한 변동 없음
    paymentStatus = "failed";
  }

  await adminClient.from("payments").upsert(
    {
      payment_id: paymentId,
      user_id: userId,
      course_id: courseId,
      amount: payment.amount.total,
      status: paymentStatus,
      raw: payment.raw,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "payment_id" }
  );

  if (enrollmentStatus === "active") {
    await adminClient.from("enrollments").upsert(
      {
        user_id: userId,
        course_id: courseId,
        status: "active",
        source: "payment",
        payment_id: paymentId,
      },
      { onConflict: "user_id,course_id" }
    );
  } else if (enrollmentStatus === "refunded") {
    await adminClient
      .from("enrollments")
      .update({ status: "refunded" })
      .eq("user_id", userId)
      .eq("course_id", courseId);
  }

  return NextResponse.json({ success: true });
}
