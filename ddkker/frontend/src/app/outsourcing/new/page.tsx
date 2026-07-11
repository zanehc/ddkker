import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InquiryForm } from "@/components/outsourcing/InquiryForm";
import { SOURCES } from "@/lib/inquiry";
import type { InquirySource } from "@/types";

// 로그인 상태·유입경로에 따라 유저별로 동적 렌더링
export const dynamic = "force-dynamic";

export const metadata = {
  title: "외주 의뢰 접수 — 딸깍테크닉",
  description: "프로젝트 외주 의뢰를 남겨주시면 검토 후 연락드립니다.",
};

export default async function NewInquiryPage({
  searchParams,
}: {
  searchParams: { source?: string };
}) {
  const rawSource = searchParams.source;
  const source: InquirySource = SOURCES.includes(rawSource as InquirySource)
    ? (rawSource as InquirySource)
    : "direct";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인 필수 — 미로그인 시 로그인 후 유입경로 보존하여 복귀
  if (!user) {
    const next = `/outsourcing/new${rawSource ? `?source=${encodeURIComponent(rawSource)}` : ""}`;
    redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  }

  const initialName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "";
  const initialEmail = user.email ?? "";

  return (
    <InquiryForm
      initialName={initialName}
      initialEmail={initialEmail}
      initialSource={source}
    />
  );
}
