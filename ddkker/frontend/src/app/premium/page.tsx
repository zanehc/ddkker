import { createClient } from "@/lib/supabase/server";
import { PremiumCourses } from "@/components/sections/PremiumCourses";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import type { Faq, Course } from "@/types";

// 상태별 CTA(미로그인/미구매/구매완료)를 위해 유저별 동적 렌더링
export const dynamic = "force-dynamic";

export const metadata = {
  title: "프리미엄",
  description:
    "Claude·Codex·Antigravity와 로컬AI를 활용한 토큰절약 전략 등 고급 강의를 강의별로 구매해 영구 수강하세요.",
};

export default async function PremiumPage() {
  const supabase = createClient();

  // 프리미엄 강의 (강의별 개별 구매)
  const { data: courseData } = await supabase
    .from("courses")
    .select(
      "id, title, slug, description, category, difficulty, thumbnail_url, tier, price, highlights, sort_order, published, created_at, updated_at"
    )
    .eq("tier", "premium")
    .eq("published", true)
    .gt("price", 0)
    .order("sort_order", { ascending: true });

  const courses: Course[] = (courseData ?? []) as Course[];

  // 현재 유저 + 보유 수강권(active) 조회 → CTA 상태 결정
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let enrolledCourseIds: number[] = [];
  if (user) {
    const { data: enr } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", user.id)
      .eq("status", "active");
    enrolledCourseIds = (enr ?? []).map((e) => e.course_id as number);
  }

  // 멤버십(=프리미엄) 관련 FAQ
  const { data: faqData } = await supabase
    .from("faqs")
    .select("*")
    .eq("published", true)
    .eq("category", "membership")
    .order("sort_order", { ascending: true });

  const faqs: Faq[] = (faqData ?? []) as Faq[];

  return (
    <main className="bg-canvas min-h-screen">
      {/* 헤더 */}
      <section className="bg-surface-soft py-20 border-b border-hairline">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h1 className="text-display-lg font-bold text-ink mb-4">프리미엄</h1>
          <p className="text-muted text-lg max-w-[560px] mx-auto">
            구독이 아닌 강의별 개별 구매. 필요한 고급 강의만 골라 한 번 결제하면
            소스코드와 자료까지 평생 소장합니다.
          </p>
        </div>
      </section>

      {/* 프리미엄 강의 카탈로그 */}
      <PremiumCourses
        courses={courses}
        userId={user?.id ?? null}
        enrolledCourseIds={enrolledCourseIds}
      />

      {/* 혜택 상세 */}
      <section className="bg-surface-soft py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-display-sm font-bold text-ink text-center mb-12">
            프리미엄 강의 혜택
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: "🎓",
                title: "1회 구매 · 영구 수강",
                desc: "구독이 아니라 소유. 한 번 구매한 강의는 기간 제한 없이 평생 다시 볼 수 있습니다.",
              },
              {
                icon: "📦",
                title: "소스코드 & 설정 템플릿",
                desc: "강의에서 사용한 실제 소스코드와 재사용 가능한 설정·프로젝트 템플릿을 함께 제공합니다.",
              },
              {
                icon: "💸",
                title: "실측 비용 절감",
                desc: "로컬AI와 CLI 에이전트 조합으로 유료 토큰 사용량을 실제로 얼마나 줄이는지 대시보드로 검증합니다.",
              },
              {
                icon: "🔄",
                title: "강의 업데이트 포함",
                desc: "구매한 강의가 개정·확장되면 추가 비용 없이 최신 버전을 계속 수강합니다.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="text-2xl flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="text-title-md font-semibold text-ink mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="bg-canvas py-20">
          <div className="max-w-[800px] mx-auto px-6">
            <h2 className="text-display-sm font-bold text-ink text-center mb-10">
              자주 묻는 질문
            </h2>
            <FaqAccordion faqs={faqs} />
          </div>
        </section>
      )}
    </main>
  );
}
