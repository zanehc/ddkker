import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "딸깍러 개인정보처리방침 — 한국 정보통신망법 기준",
};

export default function PrivacyPage() {
  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[800px] mx-auto px-6 py-16 prose prose-sm">
        <h1 className="font-bold text-display-md text-ink">
          개인정보처리방침
        </h1>
        <p className="text-muted">최종 수정일: 2026년 5월 1일</p>

        <p>
          딸깍러(이하 &quot;서비스&quot;)는 이용자의 개인정보를 소중히 여기며,
          「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 및 「개인정보 보호법」을
          준수합니다.
        </p>

        <h2>1. 수집하는 개인정보</h2>
        <p>
          Google 소셜 로그인 시 다음 정보를 수집합니다:
        </p>
        <ul>
          <li>이름 (Google 계정 표시 이름)</li>
          <li>이메일 주소</li>
          <li>프로필 사진 URL</li>
        </ul>
        <p>
          서비스 이용 과정에서 IP 주소(해시 처리), 접속 로그가 자동으로 수집될 수 있습니다.
        </p>

        <h2>2. 개인정보의 이용 목적</h2>
        <ul>
          <li>회원 가입 및 서비스 제공</li>
          <li>멤버십 권한 관리</li>
          <li>자료 다운로드 서비스 제공</li>
          <li>커뮤니티 기능 제공</li>
          <li>서비스 부정 이용 방지</li>
        </ul>

        <h2>3. 보유 및 이용 기간</h2>
        <p>
          회원 탈퇴 시 즉시 파기합니다. 단, 관련 법령에 따라 보존 의무가 있는 경우
          해당 기간 동안 보관합니다:
        </p>
        <ul>
          <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
          <li>접속에 관한 기록: 3개월 (통신비밀보호법)</li>
        </ul>

        <h2>4. 개인정보의 제3자 제공</h2>
        <p>
          법령에 의한 경우를 제외하고 이용자의 동의 없이 제3자에게 개인정보를
          제공하지 않습니다. 단, 서비스 운영을 위해 아래 업체에 처리를 위탁합니다:
        </p>
        <ul>
          <li>Supabase Inc. — 회원 데이터 저장 및 인증</li>
          <li>Vercel Inc. — 웹 서비스 호스팅</li>
          <li>Cloudflare Inc. — 파일 스토리지</li>
        </ul>

        <h2>5. 이용자의 권리</h2>
        <p>이용자는 다음 권리를 행사할 수 있습니다:</p>
        <ul>
          <li>개인정보 열람 요청</li>
          <li>개인정보 정정·삭제 요청</li>
          <li>처리 정지 요청</li>
          <li>회원 탈퇴 (서비스 내 설정에서 직접 처리)</li>
        </ul>

        <h2>6. 쿠키 사용</h2>
        <p>
          서비스는 로그인 세션 유지를 위해 쿠키를 사용합니다. 브라우저 설정에서
          쿠키를 거부할 수 있으나, 이 경우 로그인이 필요한 서비스를 이용할 수 없습니다.
        </p>

        <h2>7. 개인정보 보호 책임자</h2>
        <p>
          개인정보 관련 문의 및 불만 처리는{" "}
          <a href="/community" className="text-primary hover:underline">
            커뮤니티 Q&A 게시판
          </a>
          을 이용해주세요. 빠른 시일 내 답변 드리겠습니다.
        </p>

        <h2>8. 개인정보처리방침 변경</h2>
        <p>
          이 방침은 법령 또는 서비스 변경에 따라 수정될 수 있습니다.
          변경 시 서비스 내 공지를 통해 7일 이전에 안내합니다.
        </p>
      </div>
    </main>
  );
}
