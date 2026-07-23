import Link from "next/link";
import { EmailPasswordLoginForm } from "@/components/auth/EmailPasswordLoginForm";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { BusinessInfo } from "@/components/legal/BusinessInfo";

export const metadata = { title: "로그인 — 딸깍테크닉" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next ?? "/";
  const kakaoHref = `/api/auth/kakao?next=${encodeURIComponent(next)}`;

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-canvas">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 mb-6">
            <span className="text-primary font-mono text-xl leading-none">▌</span>
            <span className="font-serif text-lg text-ink">딸깍테크닉</span>
          </Link>
          <h1 className="text-2xl font-serif font-normal text-ink mb-2">로그인</h1>
          <p className="text-sm text-muted">소셜 계정으로 간편하게 시작하세요</p>
          <p className="text-xs text-muted-soft mt-3 leading-relaxed">
            딸깍테크닉은 AI 도구·바이브코딩으로 SaaS·자동화·개발환경 구축을
            배우는 온라인 강의 플랫폼입니다.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <EmailPasswordLoginForm next={next} />

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-hairline" />
            <span className="text-xs text-muted">또는</span>
            <div className="flex-1 h-px bg-hairline" />
          </div>

          {/* Google */}
          <GoogleLoginButton next={next} />

          {/* Kakao */}
          <a
            href={kakaoHref}
            className="flex items-center justify-center gap-3 w-full h-12 rounded-md bg-[#FEE500] text-[#191919] font-semibold text-sm hover:bg-[#F0D800] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M10 2C5.582 2 2 4.91 2 8.5c0 2.28 1.47 4.28 3.7 5.46L4.9 17.1a.4.4 0 0 0 .58.44L9.2 15.1c.26.02.53.04.8.04 4.418 0 8-2.91 8-6.5S14.418 2 10 2Z"
                fill="#191919"
              />
            </svg>
            카카오로 로그인
          </a>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          로그인하면{" "}
          <Link href="/terms" className="underline hover:text-ink">이용약관</Link>
          {" "}및{" "}
          <Link href="/privacy" className="underline hover:text-ink">개인정보처리방침</Link>
          에 동의하는 것으로 간주됩니다.
        </p>

        <BusinessInfo className="mt-8" singleColumn />
      </div>
    </main>
  );
}
