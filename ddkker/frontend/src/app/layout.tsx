import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

const hakgyoan = localFont({
  src: [
    { path: "../../public/fonts/HakgyoanSimAllimjang-R.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/HakgyoanSimAllimjang-B.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-hakgyoan",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "딸깍러 — AI와 대화만으로 SaaS를 만든다",
    template: "%s | 딸깍러",
  },
  description:
    "코드 한 줄 없이 바이브코딩으로 24시간 자동화봇과 실전 SaaS를 구축하는 강의 플랫폼",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    siteName: "딸깍러",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={hakgyoan.variable}>
      <body className="bg-canvas text-ink antialiased" style={{ fontFamily: "var(--font-hakgyoan), -apple-system, sans-serif" }}>
        <TopNav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
