import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { SOURCE_LABELS, STATUS_LABELS } from "@/lib/inquiry";
import { activeEnrollmentFilter } from "@/lib/enrollment";
import type { InquirySource, InquiryStatus } from "@/types";
import Link from "next/link";

export const revalidate = 0;

export const metadata = { title: "관리자 대시보드" };

const won = (n: number) => `₩${(n ?? 0).toLocaleString("ko-KR")}`;
const date = (s: string) =>
  new Date(s).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });

type CourseRow = {
  id: number;
  title: string;
  slug: string;
  tier: "free" | "premium";
  price: number;
  published: boolean;
};

export default async function AdminDashboard() {
  await requireAdmin();

  const [
    { count: memberCount },
    { data: coursesData },
    { data: enrollData },
    { data: paidData },
    { count: resourceCount },
    { count: faqCount },
    { count: postCount },
    { data: recentProfiles },
    { count: newInquiryCount },
    { data: recentInquiries },
  ] = await Promise.all([
    adminClient.from("profiles").select("id", { count: "exact", head: true }),
    adminClient
      .from("courses")
      .select("id, title, slug, tier, price, published")
      .order("sort_order", { ascending: true }),
    adminClient
      .from("enrollments")
      .select("course_id")
      .eq("status", "active")
      .or(activeEnrollmentFilter()),
    adminClient
      .from("payments")
      .select("payment_id, course_id, amount, created_at, user_id, profiles(display_name)")
      .eq("status", "paid")
      .order("created_at", { ascending: false }),
    adminClient.from("resources").select("id", { count: "exact", head: true }).eq("published", true),
    adminClient.from("faqs").select("id", { count: "exact", head: true }),
    adminClient.from("posts").select("id", { count: "exact", head: true }),
    adminClient
      .from("profiles")
      .select("id, display_name, provider, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    adminClient
      .from("project_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    adminClient
      .from("project_inquiries")
      .select("id, title, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const inquiries = (recentInquiries ?? []) as {
    id: number;
    title: string;
    source: string;
    status: string;
    created_at: string;
  }[];

  const courses = (coursesData ?? []) as CourseRow[];
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const freeCount = courses.filter((c) => c.tier === "free").length;
  const premiumCount = courses.filter((c) => c.tier === "premium").length;
  const publishedCount = courses.filter((c) => c.published).length;

  const enroll = (enrollData ?? []) as { course_id: number }[];
  const activeEnroll = enroll.length;
  const enrollByCourse = new Map<number, number>();
  enroll.forEach((e) =>
    enrollByCourse.set(e.course_id, (enrollByCourse.get(e.course_id) ?? 0) + 1)
  );

  const paid = (paidData ?? []) as {
    payment_id: string;
    course_id: number;
    amount: number;
    created_at: string;
    user_id: string;
    // PostgREST 임베드는 배열로 반환된다
    profiles: { display_name: string | null }[] | null;
  }[];
  const revenue = paid.reduce((s, p) => s + (p.amount ?? 0), 0);
  const revenueByCourse = new Map<number, number>();
  paid.forEach((p) =>
    revenueByCourse.set(p.course_id, (revenueByCourse.get(p.course_id) ?? 0) + p.amount)
  );
  const recentPayments = paid.slice(0, 6);

  // 프리미엄 강의별 판매 현황
  const premiumSales = courses
    .filter((c) => c.tier === "premium")
    .map((c) => ({
      ...c,
      sold: enrollByCourse.get(c.id) ?? 0,
      revenue: revenueByCourse.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const KPIS = [
    { label: "누적 매출", value: won(revenue), sub: `결제 ${paid.length}건`, color: "text-primary" },
    { label: "판매 수강권", value: `${activeEnroll}`, sub: "active 수강권", color: "text-success" },
    { label: "총 회원", value: `${memberCount ?? 0}`, sub: "가입자", color: "text-accent-amber" },
    { label: "공개 강의", value: `${publishedCount}`, sub: `무료 ${freeCount} · 프리미엄 ${premiumCount}`, color: "text-ink" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-display-md font-serif text-ink">운영 대시보드</h1>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          관리자
        </span>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {KPIS.map((k) => (
          <div key={k.label} className="bg-canvas border border-hairline rounded-xl p-5">
            <p className="text-sm text-muted mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* 최근 결제 */}
        <section className="bg-canvas border border-hairline rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-md font-semibold text-ink">최근 결제</h2>
            <span className="text-xs text-muted">매출 {won(revenue)}</span>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-muted text-sm py-6 text-center">아직 결제 내역이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {recentPayments.map((p) => (
                <li key={p.payment_id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {courseMap.get(p.course_id)?.title ?? `강의 #${p.course_id}`}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {p.profiles?.[0]?.display_name ?? "이름 없음"} · {date(p.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary shrink-0 tabular-nums">
                    {won(p.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 최근 가입자 */}
        <section className="bg-canvas border border-hairline rounded-xl p-6">
          <h2 className="text-title-md font-semibold text-ink mb-4">최근 가입자</h2>
          {(recentProfiles ?? []).length === 0 ? (
            <p className="text-muted text-sm py-6 text-center">아직 가입자가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {(recentProfiles ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <p className="text-sm font-medium text-ink truncate">
                    {p.display_name ?? "이름 없음"}
                  </p>
                  <span className="text-xs text-muted shrink-0">
                    {p.provider ?? "email"} · {date(p.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 강의별 판매 현황 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-md font-semibold text-ink">프리미엄 강의별 판매</h2>
          <Link href="/admin/courses" className="text-xs text-primary hover:underline">
            강의 관리 →
          </Link>
        </div>
        {premiumSales.length === 0 ? (
          <p className="text-muted text-sm py-6 text-center">프리미엄 강의가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-hairline">
                  <th className="py-2 font-medium">강의</th>
                  <th className="py-2 font-medium text-right">가격</th>
                  <th className="py-2 font-medium text-right">판매</th>
                  <th className="py-2 font-medium text-right">매출</th>
                  <th className="py-2 font-medium text-center w-16">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {premiumSales.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 pr-3">
                      <span className="font-medium text-ink line-clamp-1">{c.title}</span>
                    </td>
                    <td className="py-2.5 text-right text-muted tabular-nums">{won(c.price)}</td>
                    <td className="py-2.5 text-right font-semibold text-ink tabular-nums">{c.sold}건</td>
                    <td className="py-2.5 text-right font-semibold text-primary tabular-nums">{won(c.revenue)}</td>
                    <td className="py-2.5 text-center">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-pill ${
                        c.published ? "bg-success/10 text-success" : "bg-surface-card text-muted"
                      }`}>
                        {c.published ? "공개" : "비공개"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 최근 외주 의뢰 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-md font-semibold text-ink">최근 외주 의뢰</h2>
          <Link href="/admin/inquiries" className="text-xs text-primary hover:underline">
            의뢰 관리 →
          </Link>
        </div>
        {inquiries.length === 0 ? (
          <p className="text-muted text-sm py-6 text-center">아직 접수된 의뢰가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {inquiries.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{q.title}</p>
                  <p className="text-xs text-muted">
                    {SOURCE_LABELS[q.source as InquirySource] ?? q.source} · {date(q.created_at)}
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-pill bg-primary/10 text-primary shrink-0">
                  {STATUS_LABELS[q.status as InquiryStatus] ?? q.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 운영 현황 (콘텐츠/커뮤니티 + 관리 바로가기) */}
      <section className="bg-canvas border border-hairline rounded-xl p-6">
        <h2 className="text-title-md font-semibold text-ink mb-4">콘텐츠 · 운영</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "강의", value: courses.length, sub: `공개 ${publishedCount}`, href: "/admin/courses", cta: "관리" },
            { label: "자료실", value: resourceCount ?? 0, sub: "공개 자료", href: "/admin/resources", cta: "관리" },
            { label: "FAQ", value: faqCount ?? 0, sub: "질문", href: "/admin/faqs", cta: "관리" },
            { label: "커뮤니티 글", value: postCount ?? 0, sub: "게시글", href: "/community", cta: "보기" },
            { label: "외주 의뢰", value: newInquiryCount ?? 0, sub: "미처리", href: "/admin/inquiries", cta: "관리" },
          ].map((m) => (
            <Link
              key={m.label}
              href={m.href}
              className="border border-hairline rounded-lg p-4 hover:border-primary/30 hover:bg-surface-soft transition-colors"
            >
              <p className="text-xs text-muted mb-0.5">{m.label}</p>
              <p className="text-xl font-bold text-ink">{m.value.toLocaleString()}</p>
              <p className="text-[11px] text-muted mt-0.5">{m.sub} · {m.cta} →</p>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-hairline">
          <Link href="/admin/courses" className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-active transition-colors">강의 등록·관리</Link>
          <Link href="/admin/resources" className="px-4 py-2 text-sm font-medium bg-canvas border border-hairline text-ink rounded-lg hover:bg-surface-soft transition-colors">자료 관리</Link>
          <Link href="/admin/faqs" className="px-4 py-2 text-sm font-medium bg-canvas border border-hairline text-ink rounded-lg hover:bg-surface-soft transition-colors">FAQ 관리</Link>
          <Link href="/admin/members" className="px-4 py-2 text-sm font-medium bg-canvas border border-hairline text-ink rounded-lg hover:bg-surface-soft transition-colors">회원·수강권</Link>
        </div>
      </section>
    </div>
  );
}
