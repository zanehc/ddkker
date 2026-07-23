import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/server/admin-client";
import {
  getPortonePayment,
  isPortoneConfigured,
} from "@/lib/server/portone";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/complete  { paymentId, courseId }
 *
 * 프론트 결제 콜백만으로 수강권을 부여하지 않는다.
 * 서버가 포트원 API로 결제를 재조회하여 status·amount를 검증한 뒤에만
 * payments + enrollments 를 멱등하게 기록한다. (금액 위변조 차단)
 */
export async function POST(req: NextRequest) {
  if (!isPortoneConfigured()) {
    return NextResponse.json(
      { error: "결제 모듈이 아직 설정되지 않았습니다 (PORTONE_API_SECRET 미설정)" },
      { status: 503 }
    );
  }

  // 1) 로그인 사용자 확인
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  // 2) 입력 파싱
  let body: { paymentId?: string; courseId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }
  const { paymentId, courseId } = body;
  if (!paymentId || !courseId) {
    return NextResponse.json(
      { error: "paymentId와 courseId는 필수입니다" },
      { status: 400 }
    );
  }

  // 3) 강의 가격 확인 (service role — 신뢰 가능한 금액 출처)
  const { data: course } = await adminClient
    .from("courses")
    .select("id, price, tier, published, title, slug")
    .eq("id", courseId)
    .single();

  if (!course || !course.published || course.tier !== "premium") {
    return NextResponse.json(
      { error: "구매할 수 없는 강의입니다" },
      { status: 400 }
    );
  }

  // 4) 포트원 결제 재조회 + 검증
  let payment;
  try {
    payment = await getPortonePayment(paymentId);
  } catch (e) {
    return NextResponse.json(
      { error: `결제 조회 실패: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  const paid = payment.status === "PAID";
  const amountMatches = payment.amount.total === course.price;

  if (!paid || !amountMatches) {
    // 검증 실패는 기록만 남기고 권한은 부여하지 않음
    await adminClient.from("payments").upsert(
      {
        payment_id: paymentId,
        user_id: user.id,
        course_id: course.id,
        amount: payment.amount.total,
        status: paid ? "paid" : "failed",
        raw: payment.raw,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "payment_id" }
    );
    return NextResponse.json(
      {
        error: !paid
          ? `결제가 완료되지 않았습니다 (status=${payment.status})`
          : `결제 금액이 일치하지 않습니다 (결제 ${payment.amount.total} ≠ 가격 ${course.price})`,
      },
      { status: 400 }
    );
  }

  // 5) 멱등 기록: payments(paymentId PK) + enrollments(user,course UNIQUE)
  const { error: payErr } = await adminClient.from("payments").upsert(
    {
      payment_id: paymentId,
      user_id: user.id,
      course_id: course.id,
      amount: payment.amount.total,
      status: "paid",
      raw: payment.raw,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "payment_id" }
  );
  if (payErr) {
    return NextResponse.json({ error: payErr.message }, { status: 500 });
  }

  const { error: enrErr } = await adminClient.from("enrollments").upsert(
    {
      user_id: user.id,
      course_id: course.id,
      status: "active",
      source: "payment",
      payment_id: paymentId,
    },
    { onConflict: "user_id,course_id" }
  );
  if (enrErr) {
    return NextResponse.json({ error: enrErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    courseId: course.id,
    title: course.title,
    slug: course.slug,
  });
}
