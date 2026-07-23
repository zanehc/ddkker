import { requireAdmin } from "@/lib/server/authz";
import Link from "next/link";

const ADMIN_NAV = [
  { label: "대시보드", href: "/admin" },
  { label: "강의 관리", href: "/admin/courses" },
  { label: "자료 관리", href: "/admin/resources" },
  { label: "FAQ 관리", href: "/admin/faqs" },
  { label: "회원·수강권", href: "/admin/members" },
  { label: "외주 의뢰", href: "/admin/inquiries" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin(); // 관리자 아니면 홈으로 redirect

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* 관리자 헤더 */}
      <div className="bg-surface-dark text-on-dark px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-on-dark font-semibold text-sm"
            >
              <span className="text-primary font-mono">▌</span>
              딸깍테크닉
            </Link>
            <span className="text-on-dark-soft text-sm">/ 관리자</span>
          </div>
          <Link href="/" className="text-on-dark-soft text-sm hover:text-on-dark transition-colors">
            사이트 보기 →
          </Link>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* 사이드바 */}
          <aside className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-ink hover:bg-canvas transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
