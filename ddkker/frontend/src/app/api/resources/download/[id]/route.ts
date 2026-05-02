import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/server/admin-client";
import { getPresignedDownloadUrl } from "@/lib/server/r2";
import { hasActiveMembership } from "@/lib/server/authz";
import { downloadRatelimit, checkRateLimit } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limit
  const rateLimitError = await checkRateLimit(req, downloadRatelimit);
  if (rateLimitError) return rateLimitError;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 자료 조회 (file_key는 클라이언트에 반환하지 않음)
  const { data: resource } = await adminClient
    .from("resources")
    .select("id, title, file_key, file_type, tier, published")
    .eq("id", params.id)
    .single();

  if (!resource?.published) {
    return NextResponse.json({ error: "찾을 수 없습니다" }, { status: 404 });
  }

  // 권한 확인
  if (resource.tier === "premium") {
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }
    const isMember = await hasActiveMembership(user.id);
    if (!isMember) {
      return NextResponse.json({ error: "멤버십이 필요합니다" }, { status: 403 });
    }
  }

  if (!resource.file_key) {
    return NextResponse.json({ error: "파일이 준비되지 않았습니다" }, { status: 404 });
  }

  // 다운로드 로그 + 카운트 (원자적 RPC)
  const ip = req.headers.get("x-forwarded-for") ?? "";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
  await adminClient.rpc("increment_resource_download", {
    p_resource_id: resource.id,
    p_user_id: user?.id ?? null,
    p_ip_hash: ipHash,
  });

  // Presigned URL 발급 (60초 유효)
  const url = await getPresignedDownloadUrl(resource.file_key, 60);
  return NextResponse.redirect(url);
}
