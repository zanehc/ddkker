"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Result =
  | { status: "loading" }
  | { status: "success"; title: string; slug: string | null }
  | { status: "fail"; message: string };

/**
 * 결제 완료 처리 + 결과 화면.
 * 팝업 결제(성공 시 paymentId로 이동) / 모바일 리다이렉트(code·message 포함) 양쪽을 처리한다.
 * 서버 /api/payments/complete 를 멱등 호출해 결제를 재검증하고 수강권을 확정한다.
 */
export function PaymentResult() {
  const params = useSearchParams();
  const [result, setResult] = useState<Result>({ status: "loading" });

  useEffect(() => {
    // 포트원 리다이렉트 실패: code 가 존재
    const code = params.get("code");
    if (code) {
      setResult({
        status: "fail",
        message: params.get("message") ?? "결제가 취소되었거나 실패했습니다.",
      });
      return;
    }

    const paymentId = params.get("paymentId");
    const courseId = params.get("courseId");
    if (!paymentId || !courseId) {
      setResult({ status: "fail", message: "결제 정보를 확인할 수 없습니다." });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/payments/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, courseId: Number(courseId) }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setResult({
            status: "success",
            title: data.title ?? "프리미엄 강의",
            slug: data.slug ?? null,
          });
        } else {
          setResult({
            status: "fail",
            message: data.error ?? "결제 검증에 실패했습니다.",
          });
        }
      } catch (e) {
        if (!cancelled)
          setResult({ status: "fail", message: (e as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params]);

  if (result.status === "loading") {
    return (
      <Shell>
        <div className="w-12 h-12 rounded-full border-4 border-hairline border-t-primary animate-spin mb-6" />
        <h1 className="text-title-lg font-bold text-ink mb-2">결제 확인 중…</h1>
        <p className="text-muted text-sm">결제 내역을 검증하고 수강권을 부여하고 있습니다.</p>
      </Shell>
    );
  }

  if (result.status === "fail") {
    return (
      <Shell>
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-3xl mb-6">
          ⚠️
        </div>
        <h1 className="text-display-sm font-bold text-ink mb-3">결제를 완료하지 못했습니다</h1>
        <p className="text-muted text-sm mb-2 max-w-[420px]">{result.message}</p>
        <p className="text-muted text-xs mb-8">
          결제가 진행되었는데 수강권이 부여되지 않았다면 고객센터(070-8095-7438)로 문의해 주세요.
        </p>
        <div className="flex gap-3">
          <Button href="/premium" variant="primary" size="lg">
            프리미엄으로 돌아가기
          </Button>
        </div>
      </Shell>
    );
  }

  // success
  return (
    <Shell>
      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-3xl mb-6">
        ✅
      </div>
      <h1 className="text-display-sm font-bold text-ink mb-3">결제가 완료되었습니다</h1>
      <p className="text-body text-base mb-1">
        <span className="font-semibold text-ink">{result.title}</span>
      </p>
      <p className="text-muted text-sm mb-8 max-w-[440px]">
        수강권이 부여되었습니다. 이제 <b className="text-ink">내 강의실</b>에서
        이 강의를 <b className="text-ink">영구 수강</b>하실 수 있습니다.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {result.slug && (
          <Button href={`/courses/${result.slug}`} variant="primary" size="lg">
            강의 수강하러 가기
          </Button>
        )}
        <Button href="/classroom" variant={result.slug ? "secondary" : "primary"} size="lg">
          내 강의실로 이동
        </Button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-canvas min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-20">
      <div className="flex flex-col items-center text-center">{children}</div>
    </main>
  );
}
