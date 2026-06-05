import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/mypage");
  }

  // 프로필 정보 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 멤버십 정보 조회 (status가 active인 것 중 가장 만료일이 늦은 것 혹은 단일)
  const { data: membership } = await supabase
    .from("memberships")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isPremium = !!membership;
  const membershipTierName =
    membership?.tier === "annual"
      ? "연간 프리미엄"
      : membership?.tier === "premium"
      ? "월간 프리미엄"
      : "무료 회원";

  const expiresDate = membership?.expires_at
    ? new Date(membership.expires_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "무제한";

  return (
    <main className="min-h-screen bg-canvas py-12 md:py-20">
      <div className="container-site max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-display-sm font-serif text-ink mb-2">마이페이지</h1>
          <p className="text-muted text-sm font-sans">
            계정 관리 및 소셜 계정 연동, 멤버십 정보를 확인하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 왼쪽: 프로필 요약 카드 */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className="bg-surface-card border border-hairline rounded-lg p-6 flex flex-col items-center text-center shadow-sm">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border border-hairline mb-4 bg-surface-soft flex items-center justify-center">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile?.display_name || "사용자 아바타"}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-display-sm font-serif text-muted">
                    {(profile?.display_name || "U")[0]}
                  </span>
                )}
              </div>
              <h2 className="text-title-lg font-bold text-ink mb-1">
                {profile?.display_name || "사용자"}
              </h2>
              <p className="text-muted text-xs font-mono mb-4 break-all max-w-full px-2">
                {user.email}
              </p>

              <div className="w-full pt-4 border-t border-hairline flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">가입 방식</span>
                  <span className="font-semibold text-ink capitalize flex items-center gap-1">
                    {profile?.provider === "google" && (
                      <svg width="12" height="12" viewBox="0 0 24 24" className="inline">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    {profile?.provider === "kakao" && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block mr-1"></span>
                    )}
                    {profile?.provider || "이메일"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">가입일</span>
                  <span className="text-ink">
                    {new Date(user.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/classroom"
              className="w-full py-3 px-4 bg-primary text-white text-center font-semibold rounded-md hover:bg-primary-active transition-colors shadow-sm text-sm"
            >
              내 강의실 바로가기
            </Link>
          </div>

          {/* 오른쪽: 상세 정보 카드들 */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* 멤버십 카드 */}
            <div className="bg-surface-card border border-hairline rounded-lg p-6 shadow-sm">
              <h3 className="text-title-md font-bold text-ink mb-4 pb-2 border-b border-hairline">
                멤버십 상세 정보
              </h3>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-body font-sans text-sm">현재 등급:</span>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        isPremium
                          ? "bg-primary text-white"
                          : "bg-surface-cream-strong text-muted"
                      }`}
                    >
                      {membershipTierName}
                    </span>
                  </div>
                  {isPremium ? (
                    <p className="text-xs text-muted">
                      멤버십 혜택을 이용 중입니다. 만료일:{" "}
                      <span className="font-semibold text-ink">{expiresDate}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-muted">
                      현재 무료 멤버십을 이용하고 계십니다. 프리미엄 강의 시청이 불가능합니다.
                    </p>
                  )}
                </div>

                {!isPremium && (
                  <Link
                    href="/premium"
                    className="inline-block py-2.5 px-4 bg-primary text-white text-center text-xs font-semibold rounded-md hover:bg-primary-active transition-colors shrink-0"
                  >
                    프리미엄 강의 보기
                  </Link>
                )}
              </div>

              {isPremium && (
                <div className="mt-6 p-4 bg-surface-soft border border-hairline rounded-md text-xs text-muted-soft">
                  <p className="font-semibold text-muted mb-1">프리미엄 혜택 리스트:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>플랫폼 내 모든 프리미엄 강의 및 노하우 영상 시청 가능</li>
                    <li>고급 SaaS 템플릿 및 자료실 다운로드 무제한 제공</li>
                    <li>커뮤니티 내 프리미엄 전용 질문 게시판 이용 권한</li>
                  </ul>
                </div>
              )}
            </div>

            {/* 계정 보안 및 이용 정책 */}
            <div className="bg-surface-card border border-hairline rounded-lg p-6 shadow-sm">
              <h3 className="text-title-md font-bold text-ink mb-4 pb-2 border-b border-hairline">
                이용 약관 및 정책
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/terms"
                  className="p-4 bg-canvas border border-hairline rounded-md hover:bg-surface-soft transition-colors flex justify-between items-center text-sm text-body"
                >
                  <span>서비스 이용약관</span>
                  <span className="text-muted text-xs">→</span>
                </Link>
                <Link
                  href="/privacy"
                  className="p-4 bg-canvas border border-hairline rounded-md hover:bg-surface-soft transition-colors flex justify-between items-center text-sm text-body"
                >
                  <span>개인정보 처리방침</span>
                  <span className="text-muted text-xs">→</span>
                </Link>
                <Link
                  href="/refund"
                  className="p-4 bg-canvas border border-hairline rounded-md hover:bg-surface-soft transition-colors flex justify-between items-center text-sm text-body"
                >
                  <span>환불 규정</span>
                  <span className="text-muted text-xs">→</span>
                </Link>
                <div className="p-4 bg-canvas border border-hairline rounded-md flex justify-between items-center text-sm text-body">
                  <span>고객 문의 (FAQ)</span>
                  <Link href="/faq" className="text-primary hover:underline text-xs">
                    이동하기
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
