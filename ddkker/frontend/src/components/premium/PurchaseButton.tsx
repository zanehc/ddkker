"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

type Props = {
  courseId: number;
  price: number;
  orderName: string;
  /** 비로그인이면 null */
  userId: string | null;
  /** 이미 구매(수강권 보유) 여부 */
  enrolled: boolean;
  /** 결제 성공/수강하기 시 이동 경로 */
  successHref?: string;
  variant?: "primary" | "secondary";
  className?: string;
};

/**
 * 프리미엄 강의 구매 버튼 (상태별 CTA).
 *   - 구매완료(enrolled)   → "수강하기"
 *   - 비로그인(userId 없음) → "로그인 후 구매"
 *   - 로그인·미구매         → "구매하기 ₩{price}" → 포트원 결제 실행
 *
 * 포트원 키(NEXT_PUBLIC_PORTONE_*) 미설정 시 클릭하면 안내만 표시(스캐폴딩).
 */
export function PurchaseButton({
  courseId,
  price,
  orderName,
  userId,
  enrolled,
  successHref = "/classroom",
  variant = "primary",
  className,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 구매완료
  if (enrolled) {
    return (
      <Button href={successHref} variant={variant} size="lg" className={className}>
        수강하기
      </Button>
    );
  }

  // 비로그인
  if (!userId) {
    return (
      <Button
        href="/auth/login?next=/premium"
        variant={variant}
        size="lg"
        className={className}
      >
        로그인 후 구매
      </Button>
    );
  }

  async function handlePurchase() {
    setError(null);

    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
    if (!storeId || !channelKey) {
      setError("결제 모듈이 아직 설정되지 않았습니다. 관리자에게 문의해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const PortOne = await import("@portone/browser-sdk/v2");
      const paymentId = `pay_${crypto.randomUUID()}`;

      const response = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId,
        orderName,
        totalAmount: price,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        customData: { userId, courseId },
      });

      if (!response || response.code != null) {
        setError(response?.message ?? "결제가 취소되었거나 실패했습니다.");
        setLoading(false);
        return;
      }

      // 서버 검증 + 수강권 부여
      const res = await fetch("/api/payments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: response.paymentId, courseId }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "결제 검증에 실패했습니다.");
        setLoading(false);
        return;
      }

      // 성공 → 수강 화면으로
      router.push(successHref);
      router.refresh();
    } catch (e) {
      setError((e as Error).message ?? "결제 처리 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={handlePurchase}
        variant={variant}
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? "결제 진행 중…" : `구매하기 ${won(price)}`}
      </Button>
      {error && (
        <p className="mt-2 text-xs text-red-600 leading-snug">{error}</p>
      )}
    </div>
  );
}
