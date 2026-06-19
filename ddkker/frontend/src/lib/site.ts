/**
 * 사업자 정보 단일 출처(Single Source of Truth).
 * 푸터·약관·개인정보처리방침·환불정책·프리미엄·로그인 등 모든 노출 지점이 이 상수를 참조한다.
 * PG/본인인증 입점심사는 노출 정보의 일치를 요구하므로 절대 페이지별로 하드코딩하지 말 것.
 */
export const BUSINESS = {
  serviceName: "딸깍테크닉",
  name: "베리윤",
  ceo: "윤지원",
  bizRegNo: "875-58-00614",
  // 통신판매업 신고번호는 사업자등록증에 없음(별도 신고 사항). 신고 후 기입.
  // 간이과세자는 일정 기준 미만 시 통신판매업 신고 면제 대상일 수 있음.
  mailOrderNo: "",
  address: "전라남도 순천시 중앙로 530, 101동 902호(가곡동, 대광로제비앙 리버팰리스)",
  tel: "070-8095-7438",
  email: "enen.zanehc@gmail.com",
  privacyOfficer: "윤지원", // 개인정보 보호책임자 (대표자 겸임)
} as const;

/** "전화번호" 등 라벨-값 쌍 (BusinessInfo 렌더용). 값이 빈 항목은 표시하지 않는다. */
export const BUSINESS_FIELDS: { label: string; value: string }[] = [
  { label: "상호", value: BUSINESS.name },
  { label: "대표자", value: BUSINESS.ceo },
  { label: "사업자등록번호", value: BUSINESS.bizRegNo },
  { label: "통신판매업신고", value: BUSINESS.mailOrderNo },
  { label: "사업장 주소", value: BUSINESS.address },
  { label: "전화번호", value: BUSINESS.tel },
  { label: "이메일", value: BUSINESS.email },
].filter((f) => f.value.trim() !== "");
