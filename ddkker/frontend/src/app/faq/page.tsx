import { createClient } from "@/lib/supabase/server";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import type { Faq } from "@/types";

export const revalidate = 3600;

export const metadata = {
  title: "FAQ",
  description: "딸깍러에 대해 자주 묻는 질문들을 모았습니다.",
};

type FaqCategory = "all" | "enrollment" | "membership" | "content" | "technical";

const CATEGORY_LABELS: Record<FaqCategory, string> = {
  all: "전체",
  enrollment: "수강 신청",
  membership: "멤버십",
  content: "강의 내용",
  technical: "기술 문의",
};

import Link from "next/link";

interface PageProps {
  searchParams: { category?: string };
}

export default async function FaqPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const activeCategory = (searchParams.category ?? "all") as FaqCategory;

  let query = supabase
    .from("faqs")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (activeCategory !== "all") {
    query = query.eq("category", activeCategory);
  }

  const { data: faqData } = await query;
  const faqs: Faq[] = (faqData ?? []) as Faq[];

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[800px] mx-auto px-6 py-16">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-display-lg font-serif font-normal text-ink mb-4">
            자주 묻는 질문
          </h1>
          <p className="text-muted text-lg">
            궁금한 점이 있으신가요?{" "}
            <Link href="/community" className="text-primary hover:underline">
              커뮤니티
            </Link>
            에서 질문하실 수도 있습니다.
          </p>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {(Object.keys(CATEGORY_LABELS) as FaqCategory[]).map((cat) => (
            <Link
              key={cat}
              href={cat === "all" ? "/faq" : `/faq?category=${cat}`}
              className={`px-4 py-2 rounded-pill text-sm font-medium border transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-white border-primary"
                  : "bg-canvas text-muted border-hairline hover:border-primary/40 hover:text-ink"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </Link>
          ))}
        </div>

        {/* FAQ 아코디언 */}
        <FaqAccordion faqs={faqs} />

        {/* 하단 CTA */}
        <div className="mt-16 text-center bg-surface-soft rounded-xl p-8">
          <p className="text-ink font-medium mb-2">
            원하는 답을 찾지 못하셨나요?
          </p>
          <p className="text-muted text-sm mb-4">
            커뮤니티 Q&A 게시판에 질문해주세요. 빠르게 답변 드립니다.
          </p>
          <Link
            href="/community"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            커뮤니티 Q&A 바로가기 →
          </Link>
        </div>
      </div>
    </main>
  );
}
