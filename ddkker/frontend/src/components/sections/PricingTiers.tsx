import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const TIERS = [
  {
    name: "무료",
    price: "₩0",
    period: "영구 무료",
    badge: null,
    description: "기본 강의와 자료로 시작해보세요",
    features: [
      "무료 강의 전체 수강",
      "커뮤니티 Q&A 참여",
      "무료 자료 다운로드",
      "YouTube 강의 시청",
    ],
    cta: "무료로 시작하기",
    ctaHref: "/courses",
    variant: "secondary" as const,
    highlight: false,
  },
  {
    name: "프리미엄",
    price: "문의",
    period: "베타 기간 수동 부여",
    badge: "베타",
    description: "프리미엄 강의와 모든 자료에 접근하세요",
    features: [
      "무료 강의 전체 수강",
      "프리미엄 강의 전체 수강",
      "모든 자료 무제한 다운로드",
      "프리미엄 소스코드 템플릿",
      "커뮤니티 우선 답변",
      "향후 업데이트 강의 포함",
    ],
    cta: "멤버십 문의하기",
    ctaHref: "/community/new?board=qa&title=프리미엄 멤버십 신청",
    variant: "primary" as const,
    highlight: true,
  },
] as const;

export function PricingTiers() {
  return (
    <section className="bg-canvas py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-display-md font-bold text-ink mb-4">
            멤버십 플랜
          </h2>
          <p className="text-muted text-lg max-w-[480px] mx-auto">
            베타 기간 중에는 관리자가 직접 멤버십을 부여합니다. 커뮤니티에서 문의해주세요.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 border-2 ${
                tier.highlight
                  ? "border-primary bg-primary/5"
                  : "border-hairline bg-canvas"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-8">
                  <Badge variant="primary">{tier.badge}</Badge>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-title-lg font-semibold text-ink mb-1">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-display-sm font-bold text-ink">
                    {tier.price}
                  </span>
                  <span className="text-muted text-sm">{tier.period}</span>
                </div>
                <p className="text-muted text-sm">{tier.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="text-success mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-sm text-body">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                href={tier.ctaHref}
                variant={tier.variant}
                size="lg"
                className="w-full"
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
