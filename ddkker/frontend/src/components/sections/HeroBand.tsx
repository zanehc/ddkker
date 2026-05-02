import { CodeWindow } from "@/components/ui/CodeWindow";
import { Button } from "@/components/ui/Button";

export function HeroBand() {
  return (
    <section className="bg-canvas py-20 md:py-28 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* 좌측: 헤드라인 */}
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-pill text-xs font-semibold uppercase tracking-wide mb-6">
              <span className="text-primary font-mono">▌</span>
              바이브코딩 강의 플랫폼
            </div>
            <h1 className="text-display-lg md:text-display-xl font-serif font-normal text-ink leading-tight mb-6">
              AI와 대화만으로
              <br />
              <span className="text-primary">SaaS를 만든다</span>
            </h1>
            <p className="text-body text-lg leading-relaxed mb-8 max-w-[480px]">
              Claude Code, Codex, Supabase로 코드 없이 프로덕트를 출시하는 법.
              봇이 사이트를 운영하는 과정 자체가 강의입니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button href="/courses" variant="primary" size="lg">
                무료 강의 시작하기
              </Button>
              <Button href="/membership" variant="secondary" size="lg">
                멤버십 보기
              </Button>
            </div>
          </div>

          {/* 우측: 코드 창 */}
          <div className="hidden md:block">
            <CodeWindow title="claude — ddkker-bot">
              {`$ claude -p "강의 썸네일 만들어줘" \\
  --output-format text

✓ 이미지 생성 중...
✓ R2 업로드 완료
✓ DB 업데이트: course_id=42

딸깍. 끝.`}
            </CodeWindow>
          </div>
        </div>
      </div>
    </section>
  );
}
