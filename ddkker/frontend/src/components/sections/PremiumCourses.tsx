import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { PurchaseButton } from "@/components/premium/PurchaseButton";
import type { Course } from "@/types";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

type Props = {
  courses: Course[];
  /** 비로그인이면 null */
  userId: string | null;
  /** 보유 수강권(active) course_id 목록 */
  enrolledCourseIds: number[];
};

/**
 * 프리미엄 강의 카탈로그.
 * courses 테이블(tier='premium', published)에서 받아 카드로 렌더한다.
 * sort_order가 가장 앞선 강의를 플래그십으로 강조한다.
 * CTA는 PurchaseButton이 상태별(미로그인/미구매/구매완료)로 처리한다.
 */
export function PremiumCourses({ courses, userId, enrolledCourseIds }: Props) {
  const enrolled = new Set(enrolledCourseIds);
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
              <PurchaseButton
                courseId={flagship.id}
                price={flagship.price}
                orderName={flagship.title}
                userId={userId}
                enrolled={enrolled.has(flagship.id)}
                variant="primary"
                className="w-full"
              />
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
                <PurchaseButton
                  courseId={course.id}
                  price={course.price}
                  orderName={course.title}
                  userId={userId}
                  enrolled={enrolled.has(course.id)}
                  variant="secondary"
                  className="w-full"
                />
              </div>
            ))}
          </div>
        )}

        {/* 결제 전 고지 (전자상거래법) */}
        <div className="mt-10 max-w-[720px] mx-auto rounded-xl border border-hairline bg-surface-soft px-6 py-5 text-sm text-muted leading-relaxed">
          <ul className="space-y-1.5">
            <li>· 본 상품은 온라인 강의 <strong className="text-body">디지털 콘텐츠</strong>입니다. 실물 배송이 없습니다.</li>
            <li>· 결제 완료 즉시 <strong className="text-body">내 강의실</strong>에서 영구 수강권이 부여됩니다.</li>
            <li>· 결제는 <strong className="text-body">포트원(PortOne)</strong>으로 안전하게 처리되며, 회사는 카드정보를 보관하지 않습니다.</li>
            <li>
              · 구매 전{" "}
              <Link href="/terms" className="text-primary hover:underline">이용약관</Link>
              {" "}·{" "}
              <Link href="/refund" className="text-primary hover:underline">환불정책</Link>
              을 확인해 주세요. 환불은 환불정책을 따릅니다.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
