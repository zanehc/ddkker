import type {
  ProjectType,
  BudgetRange,
  InquirySource,
  InquiryStatus,
} from "@/types";

/** 개인정보 처리 고지 버전 — 고지 문구가 바뀌면 올린다. */
export const PRIVACY_NOTICE_VERSION = "2026-07-11";

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  web: "웹사이트/웹앱",
  app: "모바일 앱",
  automation: "업무 자동화/봇",
  ai: "AI/LLM 연동",
  data: "데이터/크롤링",
  design: "디자인/기타 제작",
  etc: "기타",
};

export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  under_100: "100만원 미만",
  "100_300": "100~300만원",
  "300_500": "300~500만원",
  "500_1000": "500~1,000만원",
  over_1000: "1,000만원 이상",
  undecided: "미정/협의",
};

export const SOURCE_LABELS: Record<InquirySource, string> = {
  kmong: "크몽",
  talentnet: "재능넷",
  wishket: "위시캣",
  soomgo: "숨고",
  direct: "직접 유입",
  other: "기타",
};

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "신규",
  contacted: "상담중",
  quoted: "견적발송",
  contracted: "계약",
  done: "완료",
  dropped: "보류/취소",
};

export const PROJECT_TYPES = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[];
export const BUDGET_RANGES = Object.keys(BUDGET_RANGE_LABELS) as BudgetRange[];
export const SOURCES = Object.keys(SOURCE_LABELS) as InquirySource[];
export const STATUSES = Object.keys(STATUS_LABELS) as InquiryStatus[];
