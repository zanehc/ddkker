import { cn } from "@/lib/utils";

interface CodeWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * code-window-card — 터미널/코드 모크업 컴포넌트
 * DESIGN.md: surface-dark 배경, 탑바 3-dot + 파일명, JetBrains Mono
 */
export function CodeWindow({
  title = "terminal",
  children,
  className,
}: CodeWindowProps) {
  return (
    <div className={cn("rounded-xl bg-surface-dark overflow-hidden", className)}>
      {/* 탑바 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-dark-elevated">
        {/* 터미널 도트 */}
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-500" />
        {/* 파일명 레이블 */}
        <span className="ml-3 text-xs text-on-dark-soft font-mono">{title}</span>
      </div>
      {/* 코드 영역 — 가로 스크롤, 줄바꿈 금지 */}
      <div className="p-6 overflow-x-auto">
        <pre className="font-mono text-sm text-on-dark leading-relaxed whitespace-pre">
          {children}
        </pre>
      </div>
    </div>
  );
}
