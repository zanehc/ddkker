import type { Metadata } from "next";
import Link from "next/link";

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
              이 약관은 하나상사(대표 WANG YING, 사업자등록번호 449-04-03516, 이하 &quot;회사&quot;)가
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
              <li><strong>멤버십</strong>: 프리미엄 콘텐츠 접근 권한을 부여하는 유료 서비스</li>
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
              <li>프리미엄 콘텐츠는 유효한 멤버십을 보유한 회원만 이용할 수 있습니다.</li>
              <li>서비스는 연중무휴 24시간 제공을 원칙으로 하나, 점검·장애 시 일시 중단될 수 있습니다.</li>
              <li>회사는 운영상 필요 시 콘텐츠 내용을 변경하거나 서비스를 중단할 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제6조 (멤버십)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>멤버십은 유료로 제공되며, 이용 기간과 요금은 서비스 내 안내에 따릅니다.</li>
              <li>멤버십은 타인에게 양도하거나 공유할 수 없습니다.</li>
              <li>부정한 방법으로 멤버십을 이용한 경우 사전 통지 없이 멤버십이 취소될 수 있습니다.</li>
              <li>환불에 관한 사항은{" "}
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
              <li>멤버십 종료 후에는 프리미엄 콘텐츠에 대한 접근 권한이 소멸됩니다.</li>
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

          <div className="bg-surface-soft rounded-lg px-5 py-4 text-sm space-y-1 mt-8">
            <p><span className="font-medium text-ink">회사명:</span> 하나상사</p>
            <p><span className="font-medium text-ink">대표자:</span> WANG YING</p>
            <p><span className="font-medium text-ink">사업자등록번호:</span> 449-04-03516</p>
            <p><span className="font-medium text-ink">소재지:</span> 전라남도 나주시 금천면 천석길 35</p>
            <p>
              <span className="font-medium text-ink">이메일:</span>{" "}
              <a href="mailto:enen.zanehc@gmail.com" className="text-primary hover:underline">
                enen.zanehc@gmail.com
              </a>
            </p>
          </div>

          <p className="text-sm text-muted">본 약관은 2026년 6월 5일부터 시행됩니다.</p>

        </div>
      </div>
    </main>
  );
}
