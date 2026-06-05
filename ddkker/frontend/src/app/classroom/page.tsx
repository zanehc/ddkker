import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Course = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  thumbnail_url: string | null;
  tier: "free" | "premium";
  sort_order: number;
};

export default async function ClassroomPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/classroom");
  }

  // 1. 유저 멤버십 확인
  const { data: membership } = await supabase
    .from("memberships")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const isPremium = !!membership;

  // 2. 전체 강의 목록 조회 (published = true)
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  const typedCourses = (courses || []) as Course[];

  // 카테고리 매핑 한글 명칭
  const categoryNames: Record<string, string> = {
    "vibe-coding": "바이브 코딩",
    "autobot": "오토봇 개발",
    "saas-infra": "SaaS 인프라",
    "google-auth": "구글 인증",
    "claude-cli": "Claude CLI",
    "codex-cli": "Codex CLI",
  };

  const difficultyNames = {
    beginner: "초급",
    intermediate: "중급",
    advanced: "고급",
  };

  return (
    <main className="min-h-screen bg-canvas py-12 md:py-20">
      <div className="container-site max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-8 border-b border-hairline">
          <div>
            <h1 className="text-display-sm font-serif text-ink mb-2">내 강의실</h1>
            <p className="text-muted text-sm font-sans">
              원하는 강의를 선택하여 학습을 이어나가세요.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-surface-card border border-hairline rounded-lg p-3 shrink-0">
            <div className="text-xs font-sans">
              <span className="text-muted">학습자 권한: </span>
              <span
                className={`font-semibold ${
                  isPremium ? "text-primary" : "text-body-strong"
                }`}
              >
                {isPremium ? "프리미엄 멤버십" : "무료 회원"}
              </span>
            </div>
            {!isPremium && (
              <Link
                href="/premium"
                className="py-1.5 px-3 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary-active transition-colors"
              >
                프리미엄 보기
              </Link>
            )}
          </div>
        </div>

        {/* 강의 그리드 */}
        {typedCourses.length === 0 ? (
          <div className="text-center py-20 bg-surface-card border border-hairline rounded-lg">
            <p className="text-muted text-sm font-sans">아직 공개된 강의가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {typedCourses.map((course) => {
              const hasAccess = course.tier === "free" || isPremium;
              const linkHref = hasAccess
                ? `/courses/${course.slug}`
                : `/premium?ref=classroom&course=${course.slug}`;

              return (
                <div
                  key={course.id}
                  className="group relative flex flex-col bg-surface-card border border-hairline rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  {/* 썸네일 영역 */}
                  <div className="relative aspect-video w-full bg-surface-soft overflow-hidden border-b border-hairline">
                    {course.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-cream-strong text-muted-soft text-2xl font-serif">
                        ▌ 딸깍테크닉
                      </div>
                    )}

                    {/* 잠금 레이어 (권한 없을 때) */}
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
                        <svg
                          className="w-8 h-8 mb-2 text-white/90"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <span className="text-xs font-semibold tracking-wider">프리미엄 전용</span>
                      </div>
                    )}

                    {/* 무료 강의 배지 */}
                    {course.tier === "free" && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 text-[11px] font-semibold bg-success text-white rounded">
                        무료 강의
                      </span>
                    )}
                  </div>

                  {/* 콘텐츠 영역 */}
                  <div className="flex flex-col flex-1 p-5">
                    {/* 카테고리 & 난이도 */}
                    <div className="flex items-center gap-2 mb-2.5">
                      {course.category && (
                        <span className="text-[11px] font-medium text-primary bg-primary-disabled/20 px-2 py-0.5 rounded">
                          {categoryNames[course.category] || course.category}
                        </span>
                      )}
                      {course.difficulty && (
                        <span className="text-[11px] font-medium text-accent-amber bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                          {difficultyNames[course.difficulty]}
                        </span>
                      )}
                    </div>

                    <h3 className="text-title-md font-bold text-ink mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-muted text-xs line-clamp-2 mb-5 leading-relaxed flex-1">
                      {course.description || "이 강의에 대한 설명이 아직 준비되지 않았습니다."}
                    </p>

                    {/* 액션 버튼 */}
                    <Link
                      href={linkHref}
                      className={`w-full py-2.5 px-4 text-xs font-semibold text-center rounded transition-colors ${
                        hasAccess
                          ? "bg-canvas border border-hairline text-ink hover:bg-surface-soft"
                          : "bg-primary text-white hover:bg-primary-active"
                      }`}
                    >
                      {hasAccess ? "강의 시청하기" : "프리미엄에서 구매하기"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
