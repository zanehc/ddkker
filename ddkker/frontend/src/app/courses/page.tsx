import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import Image from "next/image";
import Link from "next/link";
import type { Course, CourseCategory } from "@/types";

export const revalidate = 300;

export const metadata = {
  title: "무료강의",
  description: "바이브코딩, SaaS 인프라, AI 자동화 강의를 무료로 수강하세요.",
};

const CATEGORY_LABELS: Record<CourseCategory | "all", string> = {
  all: "전체",
  "vibe-coding": "바이브코딩",
  autobot: "자동화봇",
  "saas-infra": "SaaS 인프라",
  "google-auth": "구글 인증",
  "claude-cli": "Claude CLI",
  "codex-cli": "Codex CLI",
  "local-ai": "로컬AI",
  "cli-orchestration": "CLI 오케스트레이션",
};

interface PageProps {
  searchParams: { category?: string };
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const activeCategory = (searchParams.category ?? "all") as CourseCategory | "all";

  let query = supabase
    .from("courses")
    .select(
      "id, title, slug, description, category, difficulty, thumbnail_url, tier, sort_order, published"
    )
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (activeCategory !== "all") {
    query = query.eq("category", activeCategory);
  }

  const { data: coursesData } = await query;
  const courses: Course[] = (coursesData ?? []) as Course[];

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        {/* 헤더 */}
        <div className="mb-10">
          <h1 className="text-display-lg font-bold text-ink mb-3">
            무료강의
          </h1>
          <p className="text-muted text-lg">
            바이브코딩으로 SaaS를 만드는 모든 과정을 배웁니다.
          </p>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex flex-wrap gap-2 mb-10">
          {(Object.keys(CATEGORY_LABELS) as Array<CourseCategory | "all">).map(
            (cat) => (
              <Link
                key={cat}
                href={cat === "all" ? "/courses" : `/courses?category=${cat}`}
                className={`px-4 py-2 rounded-pill text-sm font-medium border transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-white border-primary"
                    : "bg-canvas text-muted border-hairline hover:border-primary/40 hover:text-ink"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </Link>
            )
          )}
        </div>

        {/* 강의 그리드 */}
        {courses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted text-lg">해당 카테고리에 강의가 없습니다.</p>
            <Link
              href="/courses"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              전체 강의 보기
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="group bg-canvas border border-hairline rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all"
              >
                {/* 썸네일 */}
                <div className="aspect-video bg-surface-card relative overflow-hidden">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-primary/20 font-mono text-6xl">▌</span>
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="p-5">
                  <div className="flex gap-2 mb-3">
                    <Badge variant={course.tier === "free" ? "free" : "primary"}>
                      {course.tier === "free" ? "무료" : "프리미엄"}
                    </Badge>
                    {course.difficulty && (
                      <Badge variant={course.difficulty}>
                        {course.difficulty === "beginner"
                          ? "입문"
                          : course.difficulty === "intermediate"
                          ? "중급"
                          : "고급"}
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-title-md font-semibold text-ink mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h2>
                  {course.description && (
                    <p className="text-muted text-sm line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
