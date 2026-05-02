import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import Link from "next/link";

export const revalidate = 0;

export const metadata = {
  title: "관리자 대시보드",
};

export default async function AdminDashboard() {
  await requireAdmin();

  // 통계 조회
  const [
    { count: courseCount },
    { count: resourceCount },
    { count: memberCount },
    { count: postCount },
    { data: recentProfiles },
  ] = await Promise.all([
    adminClient.from("courses").select("id", { count: "exact", head: true }).eq("published", true),
    adminClient.from("resources").select("id", { count: "exact", head: true }).eq("published", true),
    adminClient.from("memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
    adminClient.from("posts").select("id", { count: "exact", head: true }),
    adminClient
      .from("profiles")
      .select("id, display_name, provider, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const STATS = [
    { label: "공개 강의", value: courseCount ?? 0, href: "/admin/courses", color: "text-primary" },
    { label: "공개 자료", value: resourceCount ?? 0, href: "/admin/resources", color: "text-success" },
    { label: "활성 멤버십", value: memberCount ?? 0, href: "/admin/members", color: "text-accent-amber" },
    { label: "커뮤니티 글", value: postCount ?? 0, href: "/community", color: "text-muted" },
  ];

  return (
    <div>
      <h1 className="text-display-md font-serif text-ink mb-8">운영 대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {STATS.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-canvas border border-hairline rounded-xl p-5 hover:border-primary/30 transition-colors"
          >
            <p className={`text-3xl font-bold mb-1 ${stat.color}`}>
              {stat.value.toLocaleString()}
            </p>
            <p className="text-sm text-muted">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 최근 가입자 */}
        <section className="bg-canvas border border-hairline rounded-xl p-6">
          <h2 className="text-title-md font-semibold text-ink mb-4">
            최근 가입자
          </h2>
          {(recentProfiles ?? []).length === 0 ? (
            <p className="text-muted text-sm">아직 가입자가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {(recentProfiles ?? []).map((profile) => (
                <div key={profile.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {profile.display_name ?? "이름 없음"}
                    </p>
                    <p className="text-xs text-muted">
                      {profile.provider ?? "unknown"} ·{" "}
                      {new Date(profile.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 최근 커뮤니티 글 */}
        <section className="bg-canvas border border-hairline rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-md font-semibold text-ink">
              커뮤니티
            </h2>
            <Link href="/community" className="text-xs text-primary hover:underline">
              전체 보기
            </Link>
          </div>
          <p className="text-sm text-muted">
            총 <span className="font-semibold text-ink">{postCount ?? 0}</span>개의 게시글이 있습니다.
          </p>
        </section>
      </div>

      {/* 빠른 작업 */}
      <section className="mt-6 bg-canvas border border-hairline rounded-xl p-6">
        <h2 className="text-title-md font-semibold text-ink mb-4">빠른 작업</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/courses"
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-active transition-colors"
          >
            강의 등록
          </Link>
          <Link
            href="/admin/resources"
            className="px-4 py-2 text-sm font-medium bg-canvas border border-hairline text-ink rounded-lg hover:bg-surface-soft transition-colors"
          >
            자료 등록
          </Link>
          <Link
            href="/admin/faqs"
            className="px-4 py-2 text-sm font-medium bg-canvas border border-hairline text-ink rounded-lg hover:bg-surface-soft transition-colors"
          >
            FAQ 등록
          </Link>
          <Link
            href="/admin/members"
            className="px-4 py-2 text-sm font-medium bg-canvas border border-hairline text-ink rounded-lg hover:bg-surface-soft transition-colors"
          >
            멤버십 부여
          </Link>
        </div>
      </section>
    </div>
  );
}
