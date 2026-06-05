"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { label: "소개", href: "/" },
  { label: "무료강의", href: "/courses" },
  { label: "프리미엄", href: "/premium" },
  { label: "자료실", href: "/resources" },
  { label: "커뮤니티", href: "/community" },
  { label: "FAQ", href: "/faq" },
  { label: "YOUTUBE", href: "/youtube" },
] as const;

type NavUser = { name: string; avatarUrl: string | null };

function toNavUser(user: User | null): NavUser | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    name: meta.full_name ?? meta.name ?? user.email ?? "사용자",
    avatarUrl: meta.avatar_url ?? null,
  };
}

/**
 * TopNav — 64px 높이, canvas 배경
 * DESIGN.md: 좌-로고, 중-네비, 우-로그인+CTA
 * 모바일: 햄버거 → 전체화면 크림 시트
 *
 * 인증 상태는 클라이언트에서 onAuthStateChange로 구독한다.
 * (layout에서 서버 cookies()를 읽으면 ISR 페이지가 동적 렌더링으로 바뀌므로 클라에서 처리)
 */
export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<NavUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    // 구독 시 INITIAL_SESSION 이벤트로 현재 세션이 즉시 전달된다.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toNavUser(session?.user ?? null));
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setMobileOpen(false);
    router.refresh();
  }

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
          <span className="font-display tracking-tight">딸깍테크닉</span>
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
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {user ? (
            <>
              <Link
                href="/classroom"
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                내 강의실
              </Link>
              <Link
                href="/mypage"
                className="text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                마이페이지
              </Link>
              <span className="flex items-center gap-2 text-sm font-medium text-ink border-l border-hairline pl-4">
                {user.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-hairline"
                  />
                )}
                <span className="max-w-[120px] truncate">{user.name}</span>
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-primary hover:underline"
              >
                로그인
              </Link>
              <Button href="/courses" variant="primary" size="md">
                무료 시작하기
              </Button>
            </>
          )}
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
              {user ? (
                <>
                  <Link
                    href="/classroom"
                    className="text-center py-3 text-sm font-semibold bg-primary text-white rounded-md hover:bg-primary/95 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    내 강의실
                  </Link>
                  <Link
                    href="/mypage"
                    className="text-center py-3 text-sm font-medium text-ink border border-hairline rounded-md hover:bg-surface-soft transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    마이페이지
                  </Link>
                  <span className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-ink">
                    {user.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-hairline"
                      />
                    )}
                    <span className="max-w-[180px] truncate">{user.name}님</span>
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-center py-3 text-sm font-medium text-muted hover:text-ink transition-colors border border-hairline rounded-md bg-surface-soft"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-center py-3 text-sm font-medium text-primary hover:underline"
                    onClick={() => setMobileOpen(false)}
                  >
                    로그인
                  </Link>
                  <Button
                    href="/courses"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => setMobileOpen(false)}
                  >
                    무료 시작하기
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
