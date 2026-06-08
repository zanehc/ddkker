import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/server/admin-client";
import { getPresignedUploadUrl } from "@/lib/server/r2";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * 관리자 전용: R2 직접 업로드용 presigned PUT URL을 발급한다.
 * 요청: { filename: string, contentType: string }
 * 응답: { url: string, key: string }
 * 클라이언트는 받은 url로 PUT(Content-Type 동일) 한 뒤, key를 자료 메타데이터에 저장한다.
 */
export async function POST(req: NextRequest) {
  // 관리자 검증 (API라 redirect 대신 JSON 상태코드 반환)
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  const { data: adminRow } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminRow) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  let body: { filename?: string; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const filename = (body.filename ?? "").trim();
  const contentType = (body.contentType ?? "application/octet-stream").trim();
  if (!filename) {
    return NextResponse.json({ error: "파일명이 필요합니다" }, { status: 400 });
  }

  // 키 생성: 충돌 방지 + 안전한 문자만. 원본 파일명은 끝부분만 보존.
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const key = `resources/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  const url = await getPresignedUploadUrl(key, contentType, 120);
  return NextResponse.json({ url, key });
}
