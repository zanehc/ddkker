// ── DB 타입 (Supabase 테이블 기준) ─────────────────────────

export type CourseCategory =
  | "vibe-coding"
  | "autobot"
  | "saas-infra"
  | "google-auth"
  | "claude-cli"
  | "codex-cli"
  | "local-ai"
  | "cli-orchestration";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Tier = "free" | "premium";

export type MembershipStatus = "active" | "expired" | "canceled" | "refunded";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  provider: "google" | "kakao" | null;
  marketing_opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  category: CourseCategory | null;
  difficulty: Difficulty | null;
  thumbnail_url: string | null;
  tier: Tier;
  price: number;
  highlights: string[];
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type EnrollmentStatus = "active" | "refunded";
export type PaymentStatus = "paid" | "failed" | "cancelled" | "refunded";

export interface Enrollment {
  id: number;
  user_id: string;
  course_id: number;
  status: EnrollmentStatus;
  source: "payment" | "manual";
  payment_id: string | null;
  granted_at: string;
  note: string | null;
}

export interface Payment {
  payment_id: string;
  user_id: string;
  course_id: number;
  amount: number;
  status: PaymentStatus;
  raw: unknown | null;
  created_at: string;
  updated_at: string;
}

// ── 외주 의뢰(project_inquiries) ─────────────────────────
export type ProjectType = "web" | "app" | "automation" | "ai" | "data" | "design" | "etc";
export type BudgetRange =
  | "under_100"
  | "100_300"
  | "300_500"
  | "500_1000"
  | "over_1000"
  | "undecided";
export type InquirySource = "kmong" | "talentnet" | "wishket" | "soomgo" | "direct" | "other";
export type InquiryStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "contracted"
  | "done"
  | "dropped";

export interface ProjectInquiry {
  id: number;
  user_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  project_type: ProjectType;
  budget_range: BudgetRange | null;
  timeline: string | null;
  title: string;
  description: string;
  source: InquirySource;
  status: InquiryStatus;
  admin_note: string | null;
  privacy_ack_at: string | null;
  privacy_notice_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  sort_order: number;
  duration_min: number | null;
  video_url: string | null;
  body: string | null;
  tier: Tier;
  published: boolean;
  created_at: string;
}

export interface Resource {
  id: number;
  title: string;
  description: string | null;
  file_type: string | null;
  file_key: string | null;
  tier: Tier;
  course_id: number | null;
  download_count: number;
  published: boolean;
  created_at: string;
}

export interface Post {
  id: number;
  board: "qa" | "review" | "project";
  user_id: string;
  title: string;
  content: string;
  views: number;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
}

/** 수업(lesson)별 댓글/대댓글. parent_id=null이면 댓글, 값이 있으면 대댓글. */
export interface LessonComment {
  id: number;
  lesson_id: number;
  user_id: string | null;
  parent_id: number | null;
  content: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  /** 조인된 작성자 프로필 (목록 조회 시) */
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  category: "enrollment" | "membership" | "content" | "technical";
  sort_order: number;
  published: boolean;
}

export interface BotTask {
  id: number;
  task_type: "thumbnail" | "qa-assist" | "notification";
  payload: Record<string, unknown>;
  status: "pending" | "claimed" | "done" | "failed";
  priority: number;
  attempts: number;
  max_attempts: number;
  worker_id: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
  idempotency_key: string | null;
  scheduled_at: string | null;
  claimed_at: string | null;
  heartbeat_at: string | null;
  created_at: string;
  updated_at: string;
}
