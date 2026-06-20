import Link from "next/link";
import { BUSINESS } from "@/lib/site";

const FOOTER_LINKS = [
  {
    heading: "강의",
    links: [
      { label: "무료강의", href: "/courses" },
      { label: "바이브코딩", href: "/courses?category=vibe-coding" },
      { label: "자동화봇", href: "/courses?category=autobot" },
      { label: "SaaS 인프라", href: "/courses?category=saas-infra" },
    ],
  },
  {
    heading: "프리미엄",
    links: [
      { label: "프리미엄 강의", href: "/premium" },
      { label: "자료실", href: "/resources" },
      { label: "가격 안내", href: "/premium" },
    ],
  },
  {
    heading: "커뮤니티",
    links: [
      { label: "Q&A", href: "/community?board=qa" },
      { label: "수강후기", href: "/community?board=review" },
      { label: "프로젝트 공유", href: "/community?board=project" },
      { label: "YouTube", href: "/youtube" },
    ],
  },
  {
    heading: "회사",
    links: [
      { label: "소개", href: "/" },
      { label: "FAQ", href: "/faq" },
      { label: "이용약관", href: "/terms" },
      { label: "개인정보처리방침", href: "/privacy" },
      { label: "환불정책", href: "/refund" },
    ],
  },
] as const;

/**
 * Footer — surface-dark 배경, on-dark-soft 텍스트
 * DESIGN.md: 4열 링크 + 딸깍테크닉 로고, 수직 패딩 64px
 */
export function Footer() {
  return (
    <footer className="bg-surface-dark text-on-dark-soft">
      <div className="container-site py-16">
        {/* 로고 */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-on-dark font-semibold text-base"
          >
            <span className="text-primary font-mono text-lg leading-none">▌</span>
            <span className="font-display tracking-tight">딸깍테크닉</span>
          </Link>
          <p className="mt-2 text-sm text-on-dark-soft max-w-xs">
            AI와 대화만으로 SaaS를 만든다
          </p>
        </div>

        {/* 링크 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {FOOTER_LINKS.map((section) => (
            <div key={section.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-on-dark mb-4">
                {section.heading}
              </h3>
              <ul className="flex flex-col gap-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-on-dark-soft hover:text-on-dark transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 사업자 정보 */}
        <div className="pt-8 border-t border-surface-dark-elevated">
          <dl className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-on-dark-soft mb-4">
            <div className="flex gap-1.5">
              <dt className="text-on-dark/60">상호</dt>
              <dd>{BUSINESS.name}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-on-dark/60">대표</dt>
              <dd>{BUSINESS.ceo}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-on-dark/60">사업자등록번호</dt>
              <dd>{BUSINESS.bizRegNo}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-on-dark/60">전화</dt>
              <dd>
                <a href={`tel:${BUSINESS.tel}`} className="hover:text-on-dark transition-colors">
                  {BUSINESS.tel}
                </a>
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-on-dark/60">이메일</dt>
              <dd>
                <a href={`mailto:${BUSINESS.email}`} className="hover:text-on-dark transition-colors">
                  {BUSINESS.email}
                </a>
              </dd>
            </div>
            <div className="flex gap-1.5 w-full sm:w-auto">
              <dt className="text-on-dark/60 shrink-0">주소</dt>
              <dd>{BUSINESS.address}</dd>
            </div>
          </dl>

          {/* 카피라이트 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-on-dark-soft">
              &copy; {new Date().getFullYear()} 딸깍테크닉 / {BUSINESS.name}. All rights reserved.
            </p>
            <div className="flex gap-4 text-xs text-on-dark-soft">
              <Link href="/terms" className="hover:text-on-dark transition-colors">이용약관</Link>
              <Link href="/privacy" className="hover:text-on-dark transition-colors">개인정보처리방침</Link>
              <Link href="/refund" className="hover:text-on-dark transition-colors">환불정책</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
