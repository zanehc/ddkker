import { createClient } from "@/lib/supabase/server";
import { HeroBand } from "@/components/sections/HeroBand";
import { FeatureCards } from "@/components/sections/FeatureCards";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/types";
import { getCourseThumbnail } from "@/lib/course-thumbnails";

export const revalidate = 300;

export default async function HomePage() {
  const supabase = createClient();
  const { data: latestCourses } = await supabase
    .from("courses")
    .select("id, title, slug, description, category, difficulty, thumbnail_url, tier, sort_order")
    .eq("published", true)
    .eq("tier", "free")
    .order("sort_order", { ascending: true })
    .limit(3);

  const courses: Course[] = (latestCourses ?? []) as Course[];

  return (
    <main>
      {/* 히어로 */}
      <HeroBand />

      {/* 피처 카드 */}
      <FeatureCards />

      {/* 최신 강의 3개 */}
      <section className="bg-canvas py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-display-md font-bold text-ink mb-2">
                최신 강의
              </h2>
              <p className="text-muted">지금 바로 시작할 수 있는 무료 강의</p>
            </div>
            <Link
              href="/courses"
              className="text-sm font-medium text-primary hover:underline hidden md:block"
            >
              전체 보기 →
            </Link>
          </div>

          {courses.length === 0 ? (
            <p className="text-muted text-center py-12">
              아직 등록된 강의가 없습니다.
            </p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {courses.map((course) => {
                const thumbnailUrl = getCourseThumbnail(course);

                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="group bg-canvas border border-hairline rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    {/* 썸네일 */}
                    <div className="aspect-video bg-surface-card relative overflow-hidden">
                      {thumbnailUrl ? (
                        <Image
                          src={thumbnailUrl}
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl">
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
                      <h3 className="text-title-md font-semibold text-ink mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-muted text-sm line-clamp-2">
                          {course.description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-8 md:hidden text-center">
            <Button href="/courses" variant="secondary">
              전체 강의 보기
            </Button>
          </div>
        </div>
      </section>

      {/* 인디고 콜아웃 */}
      <section className="bg-primary py-20">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-display-md font-bold text-white mb-4">
            지금 바로 바이브코딩을 시작하세요
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-[480px] mx-auto">
            Claude Code 하나로 SaaS를 만드는 방법, 딸깍테크닉에서 배우세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button href="/courses" variant="secondary" size="lg">
              무료 강의 보기
            </Button>
            <Button
              href="/premium"
              variant="secondary-dark"
              size="lg"
            >
              프리미엄 강의 보기
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
