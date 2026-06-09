/**
 * 사업자 정보 단일 출처(Single Source of Truth).
 * 푸터·약관·개인정보처리방침·환불정책·프리미엄·로그인 등 모든 노출 지점이 이 상수를 참조한다.
 * PG/본인인증 입점심사는 노출 정보의 일치를 요구하므로 절대 페이지별로 하드코딩하지 말 것.
 */
export const BUSINESS = {
  serviceName: "딸깍테크닉",
  name: "하나상사",
  ceo: "WANG YING",
  bizRegNo: "449-04-03516",
  mailOrderNo: "제2025-전남나주-0174호", // 통신판매업 신고번호
  address: "전라남도 나주시 금천면 천석길 35",
  // TODO: 070 인터넷전화 개통 후 실제 번호로 교체 (휴대폰 불가 — 유선/인터넷전화만)
  tel: "070-0000-0000",
  email: "enen.zanehc@gmail.com",
  privacyOfficer: "WANG YING", // 개인정보 보호책임자 (대표자 겸임)
} as const;

/** "전화번호" 등 라벨-값 쌍 (BusinessInfo 렌더용) */
export const BUSINESS_FIELDS: { label: string; value: string }[] = [
  { label: "상호", value: BUSINESS.name },
  { label: "대표자", value: BUSINESS.ceo },
  { label: "사업자등록번호", value: BUSINESS.bizRegNo },
  { label: "통신판매업신고", value: BUSINESS.mailOrderNo },
  { label: "사업장 주소", value: BUSINESS.address },
  { label: "전화번호", value: BUSINESS.tel },
  { label: "이메일", value: BUSINESS.email },
];
