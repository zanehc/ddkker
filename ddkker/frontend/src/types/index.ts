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
