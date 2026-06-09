import type { Metadata } from "next";
import Link from "next/link";
import { BusinessInfo } from "@/components/legal/BusinessInfo";
import { BUSINESS } from "@/lib/site";

export const metadata: Metadata = {
  title: "환불정책 — 딸깍테크닉",
  description: "딸깍테크닉 온라인 강의(디지털 콘텐츠) 환불 및 청약철회 정책",
};

export default function RefundPage() {
  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[800px] mx-auto px-6 py-16">
        <h1 className="font-serif font-normal text-display-md text-ink mb-2">환불정책</h1>
        <p className="text-sm text-muted mb-10">시행일: 2026년 6월 5일</p>

        <div className="prose prose-sm max-w-none text-body leading-relaxed space-y-8">

          <p>
            딸깍테크닉은 「전자상거래 등에서의 소비자보호에 관한 법률」(이하 전자상거래법) 및
            「콘텐츠산업진흥법」에 따라 아래와 같이 환불정책을 운영합니다.
          </p>

          {/* 비실물 디지털 콘텐츠 안내 */}
          <div className="bg-surface-soft border border-hairline rounded-xl px-6 py-5 text-sm space-y-1.5">
            <p className="font-semibold text-ink">상품 및 배송 안내</p>
            <p>
              딸깍테크닉의 유료 상품은 온라인 강의 및 다운로드 자료로 제공되는
              <strong> 비실물 디지털 콘텐츠</strong>이며, 별도의 실물 배송이 없습니다.
            </p>
            <p>
              디지털 콘텐츠 특성상 <strong>실물 교환은 제공되지 않으며</strong>, 환불(청약철회)
              기준은 아래와 같습니다. 결제 후 콘텐츠를 수강(열람)하거나 자료를 다운로드한 경우
              청약철회가 제한될 수 있습니다.
            </p>
          </div>

          {/* 핵심 요약 */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-6 py-5 space-y-2">
            <p className="font-semibold text-ink text-sm">환불정책 요약</p>
            <ul className="text-sm space-y-1 text-body">
              <li>✅ 결제 후 <strong>7일 이내</strong> + 콘텐츠 미이용 시 → 전액 환불</li>
              <li>✅ 결제 후 <strong>7일 이내</strong> + 콘텐츠 일부 이용 시 → 이용 비율 공제 후 환불</li>
              <li>❌ 결제 후 <strong>7일 초과</strong> → 원칙적으로 환불 불가</li>
              <li>✅ 서비스 오류·결함으로 인한 경우 → 전액 환불</li>
            </ul>
          </div>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제1조 (청약철회 기간)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                이용자는 강의 결제일로부터 <strong>7일 이내</strong>에 청약철회(환불)를 요청할 수 있습니다.
                (전자상거래법 제17조)
              </li>
              <li>
                단, 다음의 경우에는 청약철회가 제한됩니다.
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>콘텐츠가 제공된 후 이용자가 해당 콘텐츠를 이미 수강·열람한 경우</li>
                  <li>자료실 파일을 다운로드한 경우 (해당 파일에 대한 환불 불가)</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제2조 (환불 기준)</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface-card">
                  <th className="border border-hairline px-3 py-2 text-left font-semibold text-ink">상황</th>
                  <th className="border border-hairline px-3 py-2 text-left font-semibold text-ink">환불 기준</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-hairline px-3 py-2">결제 후 7일 이내, 미이용</td>
                  <td className="border border-hairline px-3 py-2">결제금액 전액 환불</td>
                </tr>
                <tr>
                  <td className="border border-hairline px-3 py-2">결제 후 7일 이내, 일부 이용</td>
                  <td className="border border-hairline px-3 py-2">결제금액 − 이용한 콘텐츠 금액 환불</td>
                </tr>
                <tr>
                  <td className="border border-hairline px-3 py-2">결제 후 7일 초과</td>
                  <td className="border border-hairline px-3 py-2">환불 불가 (단, 서비스 하자 제외)</td>
                </tr>
                <tr>
                  <td className="border border-hairline px-3 py-2">서비스 오류·결함으로 콘텐츠 제공 불가</td>
                  <td className="border border-hairline px-3 py-2">결제금액 전액 환불</td>
                </tr>
                <tr>
                  <td className="border border-hairline px-3 py-2">회사 사정으로 강의 제공이 불가해진 경우</td>
                  <td className="border border-hairline px-3 py-2">미이용 강의 결제금액 전액 환불</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제3조 (환불 신청 방법)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                환불 요청은 이메일로 접수합니다.
                <div className="mt-2 bg-surface-soft rounded-lg px-4 py-3 text-sm">
                  <p><span className="font-medium text-ink">이메일:</span>{" "}
                    <a href={`mailto:${BUSINESS.email}`} className="text-primary hover:underline">
                      {BUSINESS.email}
                    </a>
                  </p>
                  <p className="mt-1"><span className="font-medium text-ink">전화:</span>{" "}
                    <a href={`tel:${BUSINESS.tel}`} className="hover:underline">{BUSINESS.tel}</a>
                  </p>
                  <p className="mt-1 text-muted">
                    제목: [환불 요청] 가입 이메일 주소<br />
                    내용: 결제일, 결제 수단, 환불 사유
                  </p>
                </div>
              </li>
              <li>환불 요청 접수 후 <strong>3영업일 이내</strong>에 확인 및 처리 결과를 안내드립니다.</li>
              <li>환불 승인 후 결제 수단에 따라 3~5영업일 내 환불됩니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제4조 (환불 불가 사유)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>청약철회 기간(7일)이 경과한 경우</li>
              <li>콘텐츠를 이미 다운로드하거나 수강한 경우 (해당 강의)</li>
              <li>이용자의 귀책 사유로 수강권이 정지된 경우</li>
              <li>이벤트·프로모션으로 무상 제공된 강의</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제5조 (소비자 피해 구제)</h2>
            <p>
              환불 관련 분쟁이 해결되지 않을 경우 아래 기관에 도움을 요청하실 수 있습니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>콘텐츠분쟁조정위원회 (1670-5216, www.kcdrc.kr)</li>
              <li>한국소비자원 (1372, www.kca.go.kr)</li>
              <li>공정거래위원회 전자상거래 분쟁조정 (www.ftc.go.kr)</li>
            </ul>
          </section>

          <BusinessInfo className="mt-8" />

          <p className="text-sm text-muted">
            본 환불정책은 2026년 6월 5일부터 시행됩니다.{" "}
            <Link href="/terms" className="text-primary hover:underline">이용약관</Link>과 함께 적용됩니다.
          </p>

        </div>
      </div>
    </main>
  );
}
