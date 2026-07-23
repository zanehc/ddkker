import { Button } from "@/components/ui/Button";
import { BusinessInfo } from "@/components/legal/BusinessInfo";

export const metadata = {
  title: "외주 개발 의뢰 — 딸깍테크닉",
  description:
    "웹/앱·업무 자동화·AI 연동 외주 개발을 의뢰하세요. 크몽·재능넷·위시캣·숨고에서도 만나실 수 있습니다.",
};

// 각 플랫폼 프로필 URL — 확보되면 채워 넣으세요. 빈 값이면 자동으로 숨겨집니다.
// 플랫폼별 외부 링크 노출 정책을 확인한 뒤 사용하세요.
const PLATFORM_PROFILES: { name: string; url: string; emoji: string }[] = [
  { name: "크몽", url: "", emoji: "🟢" },
  { name: "재능넷", url: "", emoji: "🔵" },
  { name: "위시캣", url: "", emoji: "🐱" },
  { name: "숨고", url: "", emoji: "🟡" },
];

const SERVICES = [
  { icon: "🖥️", title: "웹사이트 · 웹앱", desc: "랜딩·소개 사이트부터 예약·결제·회원 기능까지 실제 동작하는 웹 서비스 제작." },
  { icon: "📱", title: "모바일 앱", desc: "iOS·안드로이드 앱, 또는 웹앱(PWA) 형태로 빠르게 출시." },
  { icon: "🤖", title: "업무 자동화 · 봇", desc: "반복 업무 자동화, 크롤링, 알림봇, 스프레드시트·API 연동." },
  { icon: "🧠", title: "AI · LLM 연동", desc: "Claude·GPT 등 LLM을 붙인 챗봇·문서요약·자동응대 기능 구축." },
];

const PROCESS = [
  { step: "01", title: "의뢰 접수", desc: "아래 폼으로 프로젝트 내용을 남겨주세요." },
  { step: "02", title: "상담 · 견적", desc: "요구사항을 확인하고 범위·일정·견적을 안내드립니다." },
  { step: "03", title: "제작 · 진행", desc: "합의된 범위대로 개발하며 진행 상황을 공유합니다." },
  { step: "04", title: "납품 · 검수", desc: "결과물 전달 후 수정·검수를 거쳐 마무리합니다." },
];

export default function OutsourcingPage() {
  const activeProfiles = PLATFORM_PROFILES.filter((p) => p.url);

  return (
    <main className="bg-canvas min-h-screen">
      {/* 헤더 */}
      <section className="bg-surface-soft py-20 border-b border-hairline">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <p className="text-primary text-sm font-semibold mb-3">외주 개발 의뢰</p>
          <h1 className="text-display-lg font-bold text-ink mb-4">
            아이디어를 실제 서비스로
          </h1>
          <p className="text-muted text-lg max-w-[560px] mx-auto mb-8">
            웹·앱 제작부터 업무 자동화, AI 연동까지. 필요한 프로젝트를 의뢰하면
            검토 후 빠르게 상담해 드립니다.
          </p>
          <Button href="/outsourcing/new" variant="primary" size="lg">
            프로젝트 의뢰하기
          </Button>
        </div>
      </section>

      {/* 제공 서비스 */}
      <section className="py-20">
        <div className="max-w-[1000px] mx-auto px-6">
          <h2 className="text-display-sm font-bold text-ink text-center mb-12">제공 서비스</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {SERVICES.map((s) => (
              <div key={s.title} className="flex gap-4">
                <div className="text-2xl flex-shrink-0">{s.icon}</div>
                <div>
                  <h3 className="text-title-md font-semibold text-ink mb-2">{s.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 진행 프로세스 */}
      <section className="bg-surface-soft py-20 border-y border-hairline">
        <div className="max-w-[1000px] mx-auto px-6">
          <h2 className="text-display-sm font-bold text-ink text-center mb-12">진행 프로세스</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS.map((p) => (
              <div key={p.step} className="bg-canvas border border-hairline rounded-xl p-6">
                <span className="text-primary font-mono font-bold text-lg">{p.step}</span>
                <h3 className="text-title-md font-semibold text-ink mt-2 mb-1">{p.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 플랫폼 프로필 (URL이 설정된 것만 노출) */}
      {activeProfiles.length > 0 && (
        <section className="py-16">
          <div className="max-w-[800px] mx-auto px-6 text-center">
            <h2 className="text-title-lg font-bold text-ink mb-2">플랫폼에서도 만나요</h2>
            <p className="text-muted text-sm mb-8">
              아래 플랫폼에서도 프로필과 후기를 확인하실 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {activeProfiles.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill border border-hairline text-sm font-medium text-ink hover:border-primary/40 hover:bg-surface-soft transition-colors"
                >
                  <span>{p.emoji}</span>
                  {p.name} 프로필 →
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-primary/5 py-16 border-t border-hairline">
        <div className="max-w-[640px] mx-auto px-6 text-center">
          <h2 className="text-display-sm font-bold text-ink mb-3">프로젝트가 있으신가요?</h2>
          <p className="text-muted text-sm mb-8">
            간단한 아이디어라도 좋습니다. 남겨주시면 함께 구체화해 드리겠습니다.
          </p>
          <Button href="/outsourcing/new" variant="primary" size="lg">
            지금 의뢰하기
          </Button>
        </div>
      </section>

      {/* 사업자 정보 */}
      <section className="bg-surface-soft py-12 border-t border-hairline">
        <div className="max-w-[800px] mx-auto px-6">
          <BusinessInfo />
        </div>
      </section>
    </main>
  );
}
