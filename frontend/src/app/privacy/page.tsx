import type { Metadata } from "next";
import { BusinessInfo } from "@/components/legal/BusinessInfo";
import { BUSINESS } from "@/lib/site";

export const metadata: Metadata = {
  title: "개인정보처리방침 — 딸깍테크닉",
  description: "딸깍테크닉 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[800px] mx-auto px-6 py-16">
        <h1 className="font-serif font-normal text-display-md text-ink mb-2">개인정보처리방침</h1>
        <p className="text-sm text-muted mb-10">시행일: 2026년 6월 5일</p>

        <div className="prose prose-sm max-w-none text-body leading-relaxed space-y-8">

          <p>
            {BUSINESS.name}(이하 &quot;회사&quot;)가 운영하는 딸깍테크닉(이하 &quot;서비스&quot;)은 이용자의
            개인정보를 소중히 여기며, 「개인정보 보호법」 및 「정보통신망 이용촉진 및
            정보보호 등에 관한 법률」에 따라 아래와 같이 개인정보처리방침을 수립·공개합니다.
          </p>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제1조 (개인정보 수집 항목 및 수집 방법)</h2>
            <p className="mb-2">서비스는 다음의 개인정보를 수집합니다.</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface-card">
                  <th className="border border-hairline px-3 py-2 text-left font-semibold text-ink">수집 시점</th>
                  <th className="border border-hairline px-3 py-2 text-left font-semibold text-ink">수집 항목</th>
                  <th className="border border-hairline px-3 py-2 text-left font-semibold text-ink">수집 방법</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-hairline px-3 py-2">Google 로그인</td>
                  <td className="border border-hairline px-3 py-2">이름, 이메일 주소, 프로필 사진 URL</td>
                  <td className="border border-hairline px-3 py-2">OAuth 2.0 자동 수집</td>
                </tr>
                <tr>
                  <td className="border border-hairline px-3 py-2">서비스 이용</td>
                  <td className="border border-hairline px-3 py-2">IP 주소(해시 처리), 접속 일시, 서비스 이용 기록</td>
                  <td className="border border-hairline px-3 py-2">자동 수집</td>
                </tr>
                <tr>
                  <td className="border border-hairline px-3 py-2">유료 강의 결제</td>
                  <td className="border border-hairline px-3 py-2">결제 식별번호, 결제 금액, 결제 일시, 결제 상태</td>
                  <td className="border border-hairline px-3 py-2">결제 시 수집 (카드정보 등 결제수단 정보는 결제대행사가 처리하며 회사는 보관하지 않음)</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제2조 (개인정보 이용 목적)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>회원 식별 및 서비스 제공</li>
              <li>유료 강의 결제 및 수강권 관리</li>
              <li>강의 자료 다운로드 서비스 제공</li>
              <li>커뮤니티 서비스 운영</li>
              <li>서비스 부정 이용 방지 및 보안</li>
              <li>고지사항 전달 및 민원 처리</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제3조 (개인정보 보유 및 이용 기간)</h2>
            <p className="mb-2">
              회원 탈퇴 또는 개인정보 삭제 요청 시 지체 없이 파기합니다.
              단, 관련 법령에 따라 다음 기간 동안 보존합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>소비자 불만·분쟁처리 기록: 3년 (전자상거래법 제6조)</li>
              <li>전자금융 거래 기록: 5년 (전자금융거래법 제22조)</li>
              <li>접속에 관한 기록: 3개월 (통신비밀보호법 제15조의2)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제4조 (개인정보의 제3자 제공 및 처리 위탁)</h2>
            <p className="mb-2">
              회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
              다만, 원활한 서비스 운영을 위해 아래 업체에 처리를 위탁합니다.
            </p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface-card">
                  <th className="border border-hairline px-3 py-2 text-left font-semibold text-ink">수탁 업체</th>
                  <th className="border border-hairline px-3 py-2 text-left font-semibold text-ink">위탁 업무</th>
                  <th className="border border-hairline px-3 py-2 text-left font-semibold text-ink">보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-hairline px-3 py-2">Supabase Inc.</td>
                  <td className="border border-hairline px-3 py-2">회원 데이터 저장 및 인증</td>
                  <td className="border border-hairline px-3 py-2">회원 탈퇴 시</td>
                </tr>
                <tr>
                  <td className="border border-hairline px-3 py-2">Vercel Inc.</td>
                  <td className="border border-hairline px-3 py-2">웹 서비스 호스팅</td>
                  <td className="border border-hairline px-3 py-2">서비스 종료 시</td>
                </tr>
                <tr>
                  <td className="border border-hairline px-3 py-2">Cloudflare Inc.</td>
                  <td className="border border-hairline px-3 py-2">파일 스토리지(R2)</td>
                  <td className="border border-hairline px-3 py-2">파일 삭제 시</td>
                </tr>
                <tr>
                  <td className="border border-hairline px-3 py-2">㈜포트원 (PortOne)</td>
                  <td className="border border-hairline px-3 py-2">전자결제 대행 및 결제 검증</td>
                  <td className="border border-hairline px-3 py-2">관련 법령상 보존기간</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제5조 (이용자의 권리 및 행사 방법)</h2>
            <p className="mb-2">이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>개인정보 열람 요청</li>
              <li>개인정보 정정·삭제 요청</li>
              <li>처리 정지 요청</li>
              <li>회원 탈퇴 ({BUSINESS.email}으로 요청)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제6조 (쿠키 사용)</h2>
            <p>
              서비스는 로그인 세션 유지를 위해 쿠키를 사용합니다.
              브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우 로그인이 필요한
              기능을 이용할 수 없습니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제7조 (개인정보 보호 책임자)</h2>
            <p className="mb-3 text-sm">
              개인정보 보호책임자: <span className="font-medium text-ink">{BUSINESS.privacyOfficer}</span> (대표 겸임)
            </p>
            <BusinessInfo title={null} />
            <p className="mt-3 text-sm">
              개인정보 관련 불만·문의는 위 이메일로 접수하시면 3영업일 이내 답변 드립니다.
              개인정보침해 신고는 개인정보보호위원회(privacy.go.kr, 국번없이 182)에 하실 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-base mb-3">제8조 (개인정보처리방침 변경)</h2>
            <p>
              이 방침은 법령 또는 서비스 변경에 따라 수정될 수 있습니다.
              중요 변경 시 서비스 내 공지사항을 통해 7일 이전에 안내합니다.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
