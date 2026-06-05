import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Course } from "@/types";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

// 결제(포트원) 연동 전까지 CTA는 커뮤니티 구매 문의로 연결한다.
function inquiryHref(title: string) {
  return (
    "/community/new?board=qa&title=" +
    encodeURIComponent(`[프리미엄] ${title} 구매 문의`)
  );
}

/**
 * 프리미엄 강의 카탈로그.
 * courses 테이블(tier='premium', published)에서 받아 카드로 렌더한다.
 * sort_order가 가장 앞선 강의를 플래그십으로 강조한다.
 */
export function PremiumCourses({ courses }: { courses: Course[] }) {
  if (courses.length === 0) {
    return (
      <section className="bg-canvas py-20">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <p className="text-muted text-lg">
            준비 중인 프리미엄 강의가 곧 공개됩니다.
          </p>
        </div>
      </section>
    );
  }

  const [flagship, ...rest] = courses;

  return (
    <section className="bg-canvas py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-display-md font-bold text-ink mb-4">
            프리미엄 강의
          </h2>
          <p className="text-muted text-lg max-w-[560px] mx-auto">
            강의별로 한 번 구매하면 영구 수강. 필요한 고급 강의만 골라
            소스코드와 자료까지 평생 소장하세요.
          </p>
        </div>

        {/* 플래그십 강의 */}
        <div className="relative rounded-2xl border-2 border-primary bg-primary/5 p-8 md:p-10 mb-8">
          <div className="absolute -top-3 left-8">
            <Badge variant="primary">FLAGSHIP</Badge>
          </div>

          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-start">
            <div>
              <h3 className="text-display-sm font-bold text-ink mb-3 leading-tight">
                {flagship.title}
              </h3>
              {flagship.description && (
                <p className="text-body text-base leading-relaxed mb-6 max-w-[640px]">
                  {flagship.description}
                </p>
              )}
              {flagship.highlights.length > 0 && (
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {flagship.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3">
                      <span className="text-success mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-sm text-body leading-snug">{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="md:w-[220px] md:border-l md:border-hairline md:pl-8 flex flex-col gap-4">
              <div>
                <div className="text-display-sm font-bold text-ink">
                  {won(flagship.price)}
                </div>
                <div className="text-muted text-sm">1회 구매 · 영구 수강</div>
              </div>
              <Button
                href={inquiryHref(flagship.title)}
                variant="primary"
                size="lg"
                className="w-full"
              >
                구매 문의하기
              </Button>
            </div>
          </div>
        </div>

        {/* 나머지 프리미엄 강의 */}
        {rest.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {rest.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border-2 border-hairline bg-canvas p-8 flex flex-col"
              >
                <h3 className="text-title-lg font-semibold text-ink mb-2 leading-snug">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-muted text-sm leading-relaxed mb-6">
                    {course.description}
                  </p>
                )}
                {course.highlights.length > 0 && (
                  <ul className="space-y-3 mb-8 flex-1">
                    {course.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3">
                        <span className="text-success mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-sm text-body">{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-title-lg font-bold text-ink">
                    {won(course.price)}
                  </span>
                  <span className="text-muted text-sm">1회 구매 · 영구 수강</span>
                </div>
                <Button
                  href={inquiryHref(course.title)}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  구매 문의하기
                </Button>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-muted text-sm mt-10">
          베타 기간 중에는 구매 문의로 수강권을 부여합니다. 포트원 결제 연동은 준비 중입니다.
        </p>
      </div>
    </section>
  );
}
