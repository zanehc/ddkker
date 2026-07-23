import { Suspense } from "react";
import { PaymentResult } from "./PaymentResult";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "결제 완료 — 딸깍테크닉",
  robots: { index: false },
};

export default function PaymentCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="bg-canvas min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-hairline border-t-primary animate-spin" />
        </main>
      }
    >
      <PaymentResult />
    </Suspense>
  );
}
