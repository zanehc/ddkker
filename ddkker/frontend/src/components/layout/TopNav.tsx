"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "소개", href: "/" },
  { label: "무료강의", href: "/courses" },
  { label: "멤버십", href: "/membership" },
  { label: "자료실", href: "/resources" },
  { label: "커뮤니티", href: "/community" },
  { label: "FAQ", href: "/faq" },
  { label: "YOUTUBE", href: "/youtube" },
] as const;

/**
 * TopNav — 64px 높이, canvas 배경
 * DESIGN.md: 좌-로고, 중-네비, 우-로그인+CTA
 * 모바일: 햄버거 → 전체화면 크림 시트
 */
export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="h-16 bg-canvas border-b border-hairline sticky top-0 z-50">
      <div className="container-site h-full flex items-center justify-between gap-6">
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-ink font-semibold text-base shrink-0"
          onClick={() => setMobileOpen(false)}
        >
          <span className="text-primary font-mono text-lg leading-none">▌</span>
          <span className="font-display tracking-tight">딸깍러</span>
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-muted hover:text-ink transition-colors rounded-md hover:bg-surface-soft"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 우측 액션 — 데스크톱 */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            로그인
          </Link>
          <Button href="/membership" variant="primary" size="md">
            무료 시작하기
          </Button>
        </div>

        {/* 햄버거 버튼 — 모바일 */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-surface-soft transition-colors"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={mobileOpen}
        >
          <span
            className={cn(
              "block w-5 h-0.5 bg-ink transition-transform",
              mobileOpen && "translate-y-2 rotate-45"
            )}
          />
          <span
            className={cn(
              "block w-5 h-0.5 bg-ink transition-opacity",
              mobileOpen && "opacity-0"
            )}
          />
          <span
            className={cn(
              "block w-5 h-0.5 bg-ink transition-transform",
              mobileOpen && "-translate-y-2 -rotate-45"
            )}
          />
        </button>
      </div>

      {/* 모바일 전체화면 메뉴 */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-canvas z-40 overflow-y-auto">
          <nav className="flex flex-col px-6 pt-6 pb-10 gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-4 text-title-md font-semibold text-ink border-b border-hairline hover:text-primary transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 mt-8">
              <Link
                href="/auth/login"
                className="text-center py-3 text-sm font-medium text-primary hover:underline"
                onClick={() => setMobileOpen(false)}
              >
                로그인
              </Link>
              <Button
                href="/membership"
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => setMobileOpen(false)}
              >
                무료 시작하기
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
