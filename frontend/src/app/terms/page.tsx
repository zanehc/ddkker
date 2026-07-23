import type { Metadata } from "next";
import Link from "next/link";
import { BusinessInfo } from "@/components/legal/BusinessInfo";
import { BUSINESS } from "@/lib/site";

export const metadata: Metadata = {
  title: "이용약관 — 딸깍테크닉",
  description: "딸깍테크닉 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[800px] mx-auto px-6 py-16">
        <h1 className="font-serif font-normal text-display-md text-ink mb-2">이용약관</h1>
        <p className="text-sm text-muted mb-10">시행일: 2026년 6월 5일</p>

        <div className="prose prose-sm max-w-none text-body leading-relaxed space-y-8">

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제1조 (목적)</h2>
            <p>
              이 약관은 {BUSINESS.name}(대표 {BUSINESS.ceo}, 사업자등록번호 {BUSINESS.bizRegNo}, 이하 &quot;회사&quot;)가
              운영하는 딸깍테크닉(이하 &quot;서비스&quot;)의 이용조건 및 절차, 회사와 이용자 간의
              권리·의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제2조 (정의)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>서비스</strong>: 회사가 운영하는 딸깍테크닉 웹사이트 및 관련 서비스 일체</li>
              <li><strong>이용자</strong>: 이 약관에 동의하고 서비스를 이용하는 자</li>
              <li><strong>회원</strong>: Google 계정으로 로그인하여 서비스를 이용하는 자</li>
              <li><strong>유료 강의</strong>: 회사가 개별 판매하는 온라인 강의 디지털 콘텐츠</li>
              <li><strong>수강권</strong>: 유료 강의를 1회 구매하여 정해진 수강 기간 동안 해당 강의를 수강할 수 있는 권리</li>
              <li><strong>수강 기간</strong>: 결제일로부터 12개월. 강의별로 다르게 정해진 경우 해당 강의 페이지에 표시된 기간을 따릅니다.</li>
              <li><strong>콘텐츠</strong>: 서비스 내 강의 영상, 자료, 텍스트 등 모든 저작물</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>이 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.</li>
              <li>회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다.</li>
              <li>약관 변경 시 적용일 7일 전 서비스 내 공지합니다. 중요 변경의 경우 30일 전 공지합니다.</li>
              <li>변경 후 계속 서비스를 이용하면 변경 약관에 동의한 것으로 간주합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제4조 (회원가입 및 탈퇴)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회원가입은 Google 소셜 로그인을 통해 이루어집니다.</li>
              <li>만 14세 미만은 회원가입이 불가합니다.</li>
              <li>회원은 언제든지 탈퇴를 요청할 수 있으며, 탈퇴 즉시 개인정보는 파기됩니다.</li>
              <li>탈퇴 후에는 작성한 커뮤니티 게시글의 작성자 정보가 익명으로 처리됩니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제5조 (서비스 제공)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>서비스는 강의 콘텐츠, 자료 다운로드, 커뮤니티 기능을 제공합니다.</li>
              <li>무료 콘텐츠는 비회원도 이용할 수 있습니다.</li>
              <li>프리미엄(유료) 강의는 해당 강의를 구매한 회원만 이용할 수 있습니다.</li>
              <li>서비스는 연중무휴 24시간 제공을 원칙으로 하나, 점검·장애 시 일시 중단될 수 있습니다.</li>
              <li>회사는 운영상 필요 시 콘텐츠 내용을 변경하거나 서비스를 중단할 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제6조 (유료 강의 구매 및 결제)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>유료 강의는 강의별로 개별 판매되며, 가격은 서비스 내 각 강의 페이지에 표시됩니다.</li>
              <li>유료 강의는 온라인으로 제공되는 비실물 디지털 콘텐츠이며, 별도의 실물 배송은 없습니다.</li>
              <li>1회 구매 시 해당 강의에 대한 수강권이 부여되며, 구매한 수강권은 타인에게 양도·공유할 수 없습니다.</li>
              <li>수강권의 유효기간은 <strong>결제일로부터 12개월</strong>입니다. 강의별로 다른 기간이 적용되는 경우 구매 전 해당 강의 페이지에 표시합니다.</li>
              <li>수강 기간이 만료되면 해당 강의 영상 및 연결된 자료의 이용이 종료되며, 계속 수강하려면 다시 구매해야 합니다. 만료 예정일은 마이페이지에서 확인할 수 있습니다.</li>
              <li>결제는 회사가 연동한 전자결제대행사(포트원)를 통해 안전하게 처리되며, 회사는 카드정보 등 결제수단 정보를 직접 보관하지 않습니다.</li>
              <li>부정한 방법으로 강의를 이용한 경우 사전 통지 없이 수강권이 취소될 수 있습니다.</li>
              <li>청약철회·환불에 관한 사항은{" "}
                <Link href="/refund" className="text-primary hover:underline">환불정책</Link>
                에 따릅니다.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제7조 (이용자의 의무)</h2>
            <p className="mb-2">이용자는 다음 행위를 하여서는 안 됩니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>타인의 정보를 도용하거나 허위 정보를 등록하는 행위</li>
              <li>서비스의 운영을 방해하거나 안정성을 해치는 행위</li>
              <li>저작권 등 타인의 지식재산권을 침해하는 행위</li>
              <li>서비스 콘텐츠를 무단으로 복제·배포·판매하는 행위</li>
              <li>타인에게 혐오감·불쾌감을 주는 내용을 게시하는 행위</li>
              <li>기타 관련 법령을 위반하는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제8조 (콘텐츠 저작권)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>서비스가 제공하는 강의 영상, 자료, 텍스트 등의 저작권은 회사 또는 해당 창작자에게 있습니다.</li>
              <li>이용자는 콘텐츠를 개인 학습 목적으로만 이용할 수 있습니다.</li>
              <li>구매한 강의의 수강권은 수강 기간 동안 유지되며, 기간 만료 또는 환불(청약철회) 완료 시 소멸됩니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제9조 (서비스 이용 제한)</h2>
            <p>
              회사는 이용자가 제7조를 위반하거나 서비스 운영에 현저한 지장을 초래한 경우,
              경고·일시 정지·영구 이용 정지 등의 조치를 취할 수 있습니다.
              이용 제한 시 사전 통지를 원칙으로 하나 긴급한 경우 사후 통지할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제10조 (면책조항)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회사는 천재지변, 불가항력적 사유로 인한 서비스 중단에 책임을 지지 않습니다.</li>
              <li>이용자 귀책 사유로 발생한 서비스 이용 장애에 대해 회사는 책임을 지지 않습니다.</li>
              <li>이용자가 게시한 정보의 신뢰성·정확성에 대해 회사는 책임을 지지 않습니다.</li>
              <li>강의 콘텐츠를 실무에 적용한 결과에 대한 책임은 이용자 본인에게 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제11조 (분쟁해결 및 관할)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>서비스 이용 관련 분쟁은 먼저 회사와 이용자 간 합의로 해결합니다.</li>
              <li>합의가 이루어지지 않을 경우 「콘텐츠산업진흥법」에 따라 콘텐츠분쟁조정위원회에 조정을 신청할 수 있습니다.</li>
              <li>소송이 제기될 경우 회사 소재지를 관할하는 법원을 합의관할로 합니다.</li>
            </ol>
          </section>

          <BusinessInfo className="mt-8" />

          <p className="text-sm text-muted">본 약관은 2026년 6월 5일부터 시행됩니다.</p>

        </div>
      </div>
    </main>
  );
}
