import { createClient } from "@/lib/supabase/server";
import { PricingTiers } from "@/components/sections/PricingTiers";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import type { Faq } from "@/types";

export const revalidate = 3600;

export const metadata = {
  title: "멤버십",
  description: "딸깍러 멤버십으로 프리미엄 강의와 모든 자료에 접근하세요.",
};

export default async function MembershipPage() {
  const supabase = createClient();

  // 멤버십 관련 FAQ
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
          <h1 className="text-display-lg font-bold text-ink mb-4">
            멤버십
          </h1>
          <p className="text-muted text-lg max-w-[560px] mx-auto">
            프리미엄 강의, 소스코드, 템플릿에 무제한 접근하세요.
            베타 기간 중 멤버십은 커뮤니티 문의로 신청합니다.
          </p>
        </div>
      </section>

      {/* 요금제 */}
      <PricingTiers />

      {/* 혜택 상세 */}
      <section className="bg-surface-soft py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-display-sm font-bold text-ink text-center mb-12">
            프리미엄 멤버십 혜택
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: "🎓",
                title: "모든 강의 무제한 수강",
                desc: "현재 제공 중인 강의와 앞으로 추가될 강의를 모두 수강할 수 있습니다.",
              },
              {
                icon: "📦",
                title: "소스코드 & 템플릿",
                desc: "강의에서 사용한 실제 소스코드와 재사용 가능한 프로젝트 템플릿을 다운로드하세요.",
              },
              {
                icon: "💬",
                title: "커뮤니티 우선 답변",
                desc: "Q&A 게시판에서 관리자와 멤버들의 우선 답변을 받을 수 있습니다.",
              },
              {
                icon: "🔄",
                title: "업데이트 강의 포함",
                desc: "멤버십 기간 동안 추가되는 모든 새 강의를 추가 비용 없이 수강합니다.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="text-2xl flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="text-title-md font-semibold text-ink mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
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
