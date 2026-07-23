"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-canvas">
      <div className="text-center px-6">
        <p className="text-sm font-semibold text-error uppercase tracking-widest mb-4">
          오류
        </p>
        <h2 className="font-display text-display-sm text-ink mb-4">
          예상치 못한 오류가 발생했습니다
        </h2>
        <p className="text-body text-muted mb-8 max-w-md mx-auto">
          잠시 후 다시 시도해주세요. 문제가 계속되면 커뮤니티 Q&amp;A에 문의해주세요.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" onClick={reset}>
            다시 시도
          </Button>
          <Button variant="secondary" href="/">
            홈으로
          </Button>
        </div>
      </div>
    </div>
  );
}
