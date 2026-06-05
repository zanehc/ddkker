import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Course, Lesson } from "@/types";
import type { Metadata } from "next";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("courses")
    .select("title, description")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!data) return { title: "강의를 찾을 수 없습니다" };

  return {
    title: data.title,
    description: data.description ?? undefined,
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const supabase = createClient();

  const { data: courseData } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!courseData) notFound();

  const course = courseData as Course;

  // lessons 조회 (RLS가 tier 기반 필터링)
  const { data: lessonsData } = await supabase
    .from("lessons")
    .select("id, title, sort_order, duration_min, tier, published")
    .eq("course_id", course.id)
    .eq("published", true)
    .order("sort_order", { ascending: true });

  const lessons: Omit<Lesson, "video_url" | "body" | "course_id">[] = (
    lessonsData ?? []
  ) as Omit<Lesson, "video_url" | "body" | "course_id">[];

  const totalDuration = lessons.reduce(
    (sum, l) => sum + (l.duration_min ?? 0),
    0
  );
  const freeLessons = lessons.filter((l) => l.tier === "free").length;

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* 좌측: 강의 정보 */}
          <div className="lg:col-span-2">
            {/* 브레드크럼 */}
            <div className="flex items-center gap-2 text-sm text-muted mb-6">
              <a href="/courses" className="hover:text-primary transition-colors">
                무료강의
              </a>
              <span>/</span>
              <span className="text-ink">{course.title}</span>
            </div>

            {/* 배지 */}
            <div className="flex gap-2 mb-4">
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

            {/* 제목 */}
            <h1 className="text-display-md font-bold text-ink mb-4">
              {course.title}
            </h1>

            {course.description && (
              <p className="text-body text-lg leading-relaxed mb-8">
                {course.description}
              </p>
            )}

            {/* 썸네일 */}
            {course.thumbnail_url && (
              <div className="aspect-video rounded-xl overflow-hidden bg-surface-card mb-10 relative">
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* 수업 목록 */}
            <section>
              <h2 className="text-title-lg font-semibold text-ink mb-6">
                수업 목록{" "}
                <span className="text-muted font-normal text-sm">
                  ({lessons.length}개 수업)
                </span>
              </h2>

              {lessons.length === 0 ? (
                <p className="text-muted py-8 text-center">
                  아직 수업이 등록되지 않았습니다.
                </p>
              ) : (
                <div className="divide-y divide-hairline border border-hairline rounded-xl overflow-hidden">
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-4 px-5 py-4 bg-canvas hover:bg-surface-soft transition-colors"
                    >
                      <span className="text-sm text-muted w-6 flex-shrink-0 text-center">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {lesson.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {lesson.duration_min && (
                          <span className="text-xs text-muted">
                            {lesson.duration_min}분
                          </span>
                        )}
                        <Badge
                          variant={lesson.tier === "free" ? "free" : "primary"}
                        >
                          {lesson.tier === "free" ? "무료" : "프리미엄"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* 우측: 사이드바 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-surface-soft border border-hairline rounded-xl p-6">
              <div className="space-y-4 mb-6 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">수업 수</span>
                  <span className="font-medium text-ink">{lessons.length}개</span>
                </div>
                {totalDuration > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">총 시간</span>
                    <span className="font-medium text-ink">
                      {Math.floor(totalDuration / 60) > 0
                        ? `${Math.floor(totalDuration / 60)}시간 `
                        : ""}
                      {totalDuration % 60 > 0 ? `${totalDuration % 60}분` : ""}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted">무료 수업</span>
                  <span className="font-medium text-ink">{freeLessons}개</span>
                </div>
                {course.difficulty && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">난이도</span>
                    <Badge variant={course.difficulty}>
                      {course.difficulty === "beginner"
                        ? "입문"
                        : course.difficulty === "intermediate"
                        ? "중급"
                        : "고급"}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {course.tier === "premium" ? (
                  <>
                    <Button href="/premium" variant="primary" size="lg" className="w-full">
                      프리미엄에서 구매하기
                    </Button>
                    <Button href="/courses" variant="secondary" size="md" className="w-full">
                      무료 강의 보기
                    </Button>
                  </>
                ) : (
                  <Button href="/courses" variant="secondary" size="md" className="w-full">
                    다른 강의 보기
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
