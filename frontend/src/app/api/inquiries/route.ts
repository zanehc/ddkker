import { createClient } from "@/lib/supabase/server";
import { inquiryRatelimit, checkRateLimit } from "@/lib/ratelimit";
import {
  PROJECT_TYPES,
  BUDGET_RANGES,
  SOURCES,
  PRIVACY_NOTICE_VERSION,
} from "@/lib/inquiry";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const rateLimitError = await checkRateLimit(req, inquiryRatelimit);
  if (rateLimitError) return rateLimitError;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await req.json();
  const {
    title,
    description,
    projectType,
    budgetRange,
    timeline,
    contactName,
    contactEmail,
    contactPhone,
    source,
    privacyAck,
  } = body ?? {};

  // 개인정보 처리 동의 필수
  if (!privacyAck) {
    return NextResponse.json(
      { error: "개인정보 수집·이용에 동의해야 접수할 수 있습니다." },
      { status: 400 }
    );
  }

  // 필수값 검증
  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "제목과 상세 내용을 입력하세요." }, { status: 400 });
  }
  if (title.trim().length < 2 || title.trim().length > 200) {
    return NextResponse.json(
      { error: "제목은 2자 이상 200자 이하여야 합니다." },
      { status: 400 }
    );
  }
  if (description.trim().length < 10 || description.trim().length > 5000) {
    return NextResponse.json(
      { error: "상세 내용은 10자 이상 5000자 이하여야 합니다." },
      { status: 400 }
    );
  }

  // 연락처 — 폼에서 프리필하지만 서버에서도 세션값으로 보정
  const name = (contactName?.trim() || (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || "").trim();
  const email = (contactEmail?.trim() || user.email || "").trim();
  if (!name || name.length > 50) {
    return NextResponse.json({ error: "이름을 정확히 입력하세요. (50자 이하)" }, { status: 400 });
  }
  if (!email || email.length < 3 || email.length > 200) {
    return NextResponse.json({ error: "연락받을 이메일을 정확히 입력하세요." }, { status: 400 });
  }
  const phone = contactPhone?.trim() || null;

  // enum 화이트리스트
  if (!PROJECT_TYPES.includes(projectType)) {
    return NextResponse.json({ error: "프로젝트 유형을 선택하세요." }, { status: 400 });
  }
  if (budgetRange && !BUDGET_RANGES.includes(budgetRange)) {
    return NextResponse.json({ error: "유효하지 않은 예산 범위입니다." }, { status: 400 });
  }
  const src = SOURCES.includes(source) ? source : "direct";

  // user_id는 서버 세션에서 주입 (클라이언트 입력 무시)
  const { data, error } = await supabase
    .from("project_inquiries")
    .insert({
      user_id: user.id,
      contact_name: name,
      contact_email: email,
      contact_phone: phone,
      project_type: projectType,
      budget_range: budgetRange || null,
      timeline: timeline?.trim() || null,
      title: title.trim(),
      description: description.trim(),
      source: src,
      privacy_ack_at: new Date().toISOString(),
      privacy_notice_version: PRIVACY_NOTICE_VERSION,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // TODO(2단계): 새 의뢰 카카오톡 알림 — notifyAdminKakao(data.id) (베스트에포트, 실패해도 접수 성공)

  return NextResponse.json({ id: data.id }, { status: 201 });
}
