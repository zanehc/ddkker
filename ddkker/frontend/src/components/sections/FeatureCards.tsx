const FEATURES = [
  {
    icon: "⚡",
    title: "바이브코딩으로 빠르게",
    description:
      "Claude Code에게 요구사항만 말하세요. 코드를 직접 쓰지 않아도 프로덕트가 완성됩니다.",
  },
  {
    icon: "🤖",
    title: "봇이 운영을 자동화",
    description:
      "썸네일 생성, Q&A 초안, 알림 발송. Oracle Cloud 봇이 24시간 사이트를 관리합니다.",
  },
  {
    icon: "🚀",
    title: "$0 인프라로 출시",
    description:
      "Vercel + Supabase + Cloudflare R2. 무료 티어 조합으로 프로덕션급 SaaS를 운영합니다.",
  },
] as const;

export function FeatureCards() {
  return (
    <section className="bg-surface-soft py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-display-md font-serif font-normal text-ink mb-4">
            왜 딸깍러인가요?
          </h2>
          <p className="text-muted text-lg max-w-[560px] mx-auto">
            개념만 가르치지 않습니다. 이 사이트 자체가 바이브코딩의 결과물입니다.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-canvas border border-hairline rounded-xl p-8 hover:border-primary/30 transition-colors"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-title-lg font-semibold text-ink mb-3">
                {feature.title}
              </h3>
              <p className="text-muted leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
