"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

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

type PayMethodOption = {
  key: string;
  label: string;
  channelKey: string;
  payMethod: "CARD" | "EASY_PAY";
};

/**
 * 결제수단 목록을 환경변수(채널 키)로부터 구성한다.
 *   - NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD     → 신용카드(예: KG이니시스)
 *   - NEXT_PUBLIC_PORTONE_CHANNEL_KEY_EASYPAY  → 카카오페이 등 간편결제
 *   - NEXT_PUBLIC_PORTONE_CHANNEL_KEY          → (구버전 호환) 간편결제로 취급
 * 설정된 채널이 2개면 사용자가 선택, 1개면 그대로 사용한다.
 */
function getPayMethods(): PayMethodOption[] {
  const cardCh = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD;
  const easyCh =
    process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_EASYPAY ||
    process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

  const methods: PayMethodOption[] = [];
  if (cardCh)
    methods.push({ key: "card", label: "신용카드", channelKey: cardCh, payMethod: "CARD" });
  if (easyCh)
    methods.push({ key: "easypay", label: "카카오페이", channelKey: easyCh, payMethod: "EASY_PAY" });
  return methods;
}

/**
 * 프리미엄 강의 구매 버튼 (상태별 CTA).
 *   - 구매완료(enrolled)   → "수강하기"
 *   - 비로그인(userId 없음) → "로그인 후 구매"
 *   - 로그인·미구매         → 결제수단 선택 + "구매하기 ₩{price}" → 포트원 결제 실행
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
  const methods = getPayMethods();
  const [methodKey, setMethodKey] = useState(methods[0]?.key ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

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

    // 이니시스 V2 일반결제는 구매자 휴대폰 번호가 필수다. (구글 로그인엔 없으므로 입력받음)
    const phoneNumber = phone.replace(/[^0-9]/g, "");
    if (phoneNumber.length < 10 || phoneNumber.length > 11) {
      setError("휴대폰 번호를 정확히 입력해 주세요. (숫자만, 예: 01012345678)");
      return;
    }

    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
    const method = methods.find((m) => m.key === methodKey) ?? methods[0];
    if (!storeId || !method) {
      setError("결제 모듈이 아직 설정되지 않았습니다. 관리자에게 문의해 주세요.");
      return;
    }

    setLoading(true);
    try {
      // 이니시스 V2 일반결제 등은 구매자 이메일이 필수다. 세션에서 직접 확보(호출부 의존 X).
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      const email = authUser?.email ?? undefined;
      const fullName =
        (authUser?.user_metadata?.full_name as string | undefined) ??
        (authUser?.user_metadata?.name as string | undefined) ??
        undefined;

      if (!email) {
        setError("결제를 위해 이메일 정보가 필요합니다. 다시 로그인 후 시도해 주세요.");
        setLoading(false);
        return;
      }

      const PortOne = await import("@portone/browser-sdk/v2");
      const paymentId = `pay_${crypto.randomUUID()}`;

      const response = await PortOne.requestPayment({
        storeId,
        channelKey: method.channelKey,
        paymentId,
        orderName,
        totalAmount: price,
        currency: "CURRENCY_KRW",
        payMethod: method.payMethod,
        customer: { email, fullName, phoneNumber },
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
      {/* 결제수단 선택 (2개 이상일 때만 노출) */}
      {methods.length > 1 && (
        <div className="flex gap-2 mb-3">
          {methods.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMethodKey(m.key)}
              className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors ${
                methodKey === m.key
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-hairline bg-canvas text-muted hover:border-primary/40"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* 구매자 휴대폰 번호 (이니시스 V2 일반결제 필수) */}
      <div className="mb-3">
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="휴대폰 번호 (예: 01012345678)"
          aria-label="휴대폰 번호"
          className="w-full h-10 px-3 rounded-md border border-hairline bg-canvas text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-[11px] text-muted">결제 영수증·본인확인에 사용됩니다.</p>
      </div>

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
