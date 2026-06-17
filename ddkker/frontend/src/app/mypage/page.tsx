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

  // 구매한 강의(수강권) 조회 — enrollments(active) + 강의 정보
  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("granted_at, course:courses(id, title, slug, price, thumbnail_url)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("granted_at", { ascending: false });

  type Purchased = {
    id: number;
    title: string;
    slug: string;
    price: number;
    thumbnail_url: string | null;
    granted_at: string;
  };
  const purchased: Purchased[] = (enrollmentRows ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => (e.course ? { ...e.course, granted_at: e.granted_at } : null))
    .filter(Boolean) as Purchased[];
  const hasPurchases = purchased.length > 0;

  return (
    <main className="min-h-screen bg-canvas py-12 md:py-20">
      <div className="container-site max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-display-sm font-serif text-ink mb-2">마이페이지</h1>
          <p className="text-muted text-sm font-sans">
            계정 정보와 구매한 강의를 확인하세요.
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
            {/* 구매한 강의 카드 */}
            <div className="bg-surface-card border border-hairline rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-hairline">
                <h3 className="text-title-md font-bold text-ink">내 프리미엄 강의</h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                  {purchased.length}개 보유
                </span>
              </div>

              {hasPurchases ? (
                <ul className="flex flex-col divide-y divide-hairline">
                  {purchased.map((c) => (
                    <li key={c.id} className="flex items-center gap-4 py-3">
                      <div className="w-16 h-10 rounded bg-surface-soft overflow-hidden shrink-0 border border-hairline flex items-center justify-center">
                        {c.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-primary/30 font-mono">▌</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">
                          {c.title}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(c.granted_at).toLocaleDateString("ko-KR")} 구매
                          · 영구 수강
                        </p>
                      </div>
                      <Link
                        href={`/courses/${c.slug}`}
                        className="shrink-0 py-2 px-3 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary-active transition-colors"
                      >
                        수강하기
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted text-sm mb-4">
                    아직 구매한 프리미엄 강의가 없습니다.
                  </p>
                  <Link
                    href="/premium"
                    className="inline-block py-2.5 px-4 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary-active transition-colors"
                  >
                    프리미엄 강의 보러가기
                  </Link>
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
