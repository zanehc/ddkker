# 딸깍러 SaaS 강의사이트 — 통합 구축 계획

> 기준 문서: `plan.md` (원본), `plan_codex.md` (Codex 보완), Claude 검토 의견  
> 작성 목적: 세 문서를 통합해 바로 실행 가능한 단일 계획으로 재정리한다.

---

## 0. 원칙

### 제품 목표

- 무료 강의와 핵심 자료로 신뢰를 만든다
- 멤버십 전환이 가능한 구조를 갖춘다
- 봇이 사이트를 운영하는 경험 자체가 강의 컨셉을 실증한다

### 구현 원칙

- **작게 출시하고 확장한다** — MVP는 공개 강의, 자료실, 로그인, 관리자 CMS, 기본 멤버십 권한, 봇 썸네일 생성까지로 제한
- **권한은 DB와 서버에서 검증한다** — UI의 lock 표시는 보조 수단. 실제 차단은 RLS, Route Handler, presigned URL에서
- **서비스 롤 키는 서버 전용이다** — `SUPABASE_SERVICE_ROLE_KEY`는 `server-only` 모듈과 봇에서만 사용
- **콘텐츠 목록과 파일 다운로드 권한을 분리한다** — 카드 메타데이터는 공개, `file_key`와 presigned URL은 서버에서만
- **봇은 비동기 작업자다** — 사용자 요청을 막지 않고, 실패와 재시도를 기록하며, 중복 실행을 막는다
- **디자인은 `DESIGN.md`를 단일 기준으로 삼는다**

### MVP 범위

**포함:**
- Next.js 앱 기본 구조 (`frontend/src` 경로 기준)
- Supabase Auth Google 로그인 (Kakao는 2차)
- 프로필 자동 생성 (DB trigger)
- 공개 페이지 7개: 홈, 무료강의, 강의상세, 멤버십, 자료실, 커뮤니티, FAQ, YouTube
- 관리자 CMS: 강의/자료/FAQ/멤버십 수동 관리, 봇 태스크 생성
- R2 자료 다운로드 게이트 (presigned URL)
- 커뮤니티 글/댓글 (RLS 완전 보호)
- 봇 태스크 큐 + Claude CLI 텍스트 처리 + Codex 썸네일 생성
- Oracle Cloud ARM VM worker + systemd
- Vercel 배포 (환경 분리)

**2차로 미룸:**
- Kakao 로그인
- 자동 결제 정기구독 (1차는 수동 멤버십 부여)
- YouTube Data API 자동 동기화
- 영상 진도율/수료증
- 고급 검색/추천

### 1차 릴리즈 완료 기준

- 운영 URL에서 회원가입/로그인/로그아웃이 동작한다
- 관리자가 강의·자료·FAQ를 등록하고 공개 페이지에서 확인할 수 있다
- 비회원은 무료 강의·자료만 접근 가능하다
- 멤버십 사용자는 프리미엄 자료 다운로드가 가능하다
- 커뮤니티 글/댓글에서 `user_id` 위조가 RLS로 차단된다
- 봇이 `thumbnail` 태스크를 처리해 `courses.thumbnail_url`을 자동 업데이트한다
- `npm run lint`, `npm run type-check`, `npm run build`가 통과한다
- 개인정보처리방침·이용약관 페이지가 존재한다

---

## 1. 기술 결정사항

| 항목 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 14 App Router | Vercel 최적화, 서버 컴포넌트로 RLS 우회 없이 안전한 데이터 접근 |
| 경로 구조 | `frontend/src/app` | create-next-app --src-dir 기본값과 일치 |
| 스타일 | Tailwind CSS (DESIGN.md 토큰 직접 반영) | UI 라이브러리 미사용, 로컬 컴포넌트만 |
| 폰트 | Noto Serif KR + Pretendard + JetBrains Mono | DESIGN.md 기준 |
| DB/Auth | Supabase PostgreSQL + Auth | RLS, Auth, Storage 통합, 무료 티어 충분 |
| 파일 | Cloudflare R2 (private bucket) | egress 무료, presigned URL |
| 영상 | YouTube Unlisted 임베드 (MVP) | 가장 빠른 출시. 이후 Vimeo로 교체 가능 |
| 결제 | MVP: 수동 부여 / 2차: 토스페이먼츠 또는 Stripe | 웹훅 안정화 후 붙임 |
| Rate limit | Upstash Redis + @upstash/ratelimit | Vercel Edge 호환, 무료 티어 있음 |
| 이메일 | Resend (월 3,000건 무료) | 멤버십 확인·관리자 알림 |
| 봇 서버 | Oracle Cloud ARM VM (4 OCPU / 24 GB) | Always Free, Claude+Codex CLI 실행 |
| 봇 AI | Claude CLI (텍스트) + Codex CLI (이미지) | API 키 없이 구독 계정으로 실행 |

---

## 2. 프로젝트 구조

```
/Users/yun/Documents/ddkker/
├── DESIGN.md
├── 강의핵심지식.md
├── plan.md
├── plan_codex.md
├── plan_claude.md             ← 이 파일
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css
│   │   │   ├── not-found.tsx
│   │   │   ├── error.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── page.tsx                    (홈)
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx                (강의 목록)
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx            (강의 상세)
│   │   │   │       └── [lessonId]/page.tsx (개별 수업)
│   │   │   ├── membership/page.tsx
│   │   │   ├── resources/page.tsx
│   │   │   ├── community/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── youtube/page.tsx
│   │   │   ├── privacy/page.tsx            (개인정보처리방침 — 법적 필수)
│   │   │   ├── terms/page.tsx              (이용약관 — 법적 필수)
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx              (requireAdmin 보호)
│   │   │   │   ├── page.tsx                (대시보드)
│   │   │   │   ├── courses/page.tsx
│   │   │   │   ├── resources/page.tsx
│   │   │   │   ├── faqs/page.tsx
│   │   │   │   ├── members/page.tsx
│   │   │   │   └── bot-tasks/page.tsx
│   │   │   ├── auth/
│   │   │   │   └── callback/route.ts
│   │   │   └── api/
│   │   │       ├── resources/download/[id]/route.ts
│   │   │       ├── posts/route.ts
│   │   │       ├── comments/route.ts
│   │   │       └── admin/
│   │   │           ├── courses/route.ts
│   │   │           ├── resources/route.ts
│   │   │           ├── members/route.ts
│   │   │           └── bot-tasks/route.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── TopNav.tsx
│   │   │   │   └── Footer.tsx
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── CodeWindow.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   └── Container.tsx
│   │   │   ├── sections/
│   │   │   │   ├── HeroBand.tsx
│   │   │   │   ├── FeatureCards.tsx
│   │   │   │   ├── CourseGrid.tsx
│   │   │   │   ├── PricingTiers.tsx
│   │   │   │   └── FaqAccordion.tsx
│   │   │   ├── community/
│   │   │   │   ├── PostList.tsx
│   │   │   │   └── CommentForm.tsx
│   │   │   └── admin/
│   │   │       ├── CourseForm.tsx
│   │   │       ├── ResourceForm.tsx
│   │   │       └── BotTaskPanel.tsx
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts              (브라우저용)
│   │   │   │   └── server.ts              (서버 컴포넌트용)
│   │   │   ├── server/                    (server-only 모듈)
│   │   │   │   ├── admin-client.ts        (service role, server-only)
│   │   │   │   ├── authz.ts               (requireAdmin, requireMembership)
│   │   │   │   ├── bot.ts                 (enqueueBotTask)
│   │   │   │   └── r2.ts                  (presigned URL)
│   │   │   ├── ratelimit.ts               (Upstash 기반)
│   │   │   └── utils.ts                   (cn)
│   │   └── types/
│   │       └── index.ts
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── package.json
│   └── .env.local.example
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql
│   │   ├── 002_rls.sql
│   │   ├── 003_functions.sql
│   │   └── 004_seed_dev.sql
│   └── tests/
│       └── rls_test.sql
└── bot/
    ├── worker.py
    ├── requirements.txt
    ├── .env.example
    ├── systemd/
    │   └── ddkkbot.service
    └── scripts/
        ├── setup_oracle.sh
        └── healthcheck.sh
```

---

## 3. DB 스키마 완전판

### `supabase/migrations/001_schema.sql`

```sql
-- ─────────────────────────────────────────────
-- 관리자
-- ─────────────────────────────────────────────
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 프로필 (auth.users 확장)
-- ─────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  provider TEXT CHECK (provider IN ('google','kakao')),
  marketing_opt_in BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 신규 사용자 프로필 자동 생성 trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'provider', 'google')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────
-- 멤버십 (권한 source of truth)
-- ─────────────────────────────────────────────
CREATE TABLE memberships (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('premium','annual')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','expired','canceled','refunded')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','payment','promo')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX memberships_user_active_idx
  ON memberships(user_id) WHERE status = 'active';

-- ─────────────────────────────────────────────
-- 강의
-- ─────────────────────────────────────────────
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN (
    'vibe-coding','autobot','saas-infra','google-auth','claude-cli','codex-cli'
  )),
  difficulty TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  thumbnail_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','premium')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 수업 단위 (강의 내 개별 영상)
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  duration_min INTEGER,
  -- video_url: free lesson은 공개, premium lesson은 서버에서만 제공
  video_url TEXT,
  body TEXT,              -- 강의 노트/설명 (마크다운)
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','premium')),
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 자료실
-- ─────────────────────────────────────────────
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN (
    'code-template','lecture-material','install-guide','source-code'
  )),
  file_key TEXT,          -- R2 object key. 절대 클라이언트에 직접 반환 금지
  file_type TEXT,
  file_size_bytes BIGINT,
  download_count INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','premium')),
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 다운로드 로그 (남용 감지·통계)
CREATE TABLE resource_downloads (
  id BIGSERIAL PRIMARY KEY,
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_hash TEXT,           -- IP를 해시해 저장 (원본 저장 금지)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 커뮤니티
-- ─────────────────────────────────────────────
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  board TEXT NOT NULL DEFAULT 'qa'
    CHECK (board IN ('qa','review','project')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 2 AND 10000),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- FAQ
-- ─────────────────────────────────────────────
CREATE TABLE faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'enrollment','membership','content','technical'
  )),
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true
);

-- ─────────────────────────────────────────────
-- 봇 태스크 큐
-- ─────────────────────────────────────────────
CREATE TABLE bot_tasks (
  id BIGSERIAL PRIMARY KEY,
  task_type TEXT NOT NULL
    CHECK (task_type IN ('thumbnail','qa-assist','notification')),
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','claimed','done','failed')),
  result JSONB,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  worker_id TEXT,
  error TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT,
  claimed_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX bot_tasks_idempotency_idx
  ON bot_tasks(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ─────────────────────────────────────────────
-- 감사 로그 (관리자 작업 추적)
-- ─────────────────────────────────────────────
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `supabase/migrations/002_rls.sql`

```sql
-- ─────────────────────────────────────────────
-- 관리자 판별 함수
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────
-- 멤버십 판별 함수
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION has_active_membership()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- INSERT는 trigger에서 SECURITY DEFINER로만 처리 (일반 사용자 직접 INSERT 금지)

-- ─────────────────────────────────────────────
-- memberships
-- ─────────────────────────────────────────────
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memberships_select_own" ON memberships
  FOR SELECT USING (auth.uid() = user_id OR is_admin());
-- INSERT/UPDATE/DELETE는 관리자 API (service role)만 가능

-- ─────────────────────────────────────────────
-- courses
-- ─────────────────────────────────────────────
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_select_published" ON courses
  FOR SELECT USING (published = true);
CREATE POLICY "courses_all_admin" ON courses
  FOR ALL USING (is_admin());

-- lessons: free는 공개, premium은 멤버십 필요
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_select" ON lessons
  FOR SELECT USING (
    published = true AND (
      tier = 'free'
      OR has_active_membership()
      OR is_admin()
    )
  );
-- premium lesson의 video_url 컬럼은 View로 마스킹하거나
-- API route에서 검증 후 제공하는 것이 더 안전함 (아래 functions.sql 참조)
CREATE POLICY "lessons_all_admin" ON lessons
  FOR ALL USING (is_admin());

-- ─────────────────────────────────────────────
-- resources: 메타데이터는 공개, file_key는 API에서만
-- ─────────────────────────────────────────────
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources_select_published" ON resources
  FOR SELECT USING (published = true);
CREATE POLICY "resources_all_admin" ON resources
  FOR ALL USING (is_admin());

ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;
-- 다운로드 로그는 service role로만 INSERT

-- ─────────────────────────────────────────────
-- posts / comments: WITH CHECK 필수
-- ─────────────────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select_visible" ON posts
  FOR SELECT USING (is_hidden = false OR is_admin());
CREATE POLICY "posts_insert_own" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_admin" ON posts
  FOR ALL USING (is_admin());

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON comments
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "comments_admin" ON comments
  FOR ALL USING (is_admin());

-- ─────────────────────────────────────────────
-- faqs, audit_logs, bot_tasks
-- ─────────────────────────────────────────────
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs_select_published" ON faqs FOR SELECT USING (published = true);
CREATE POLICY "faqs_admin" ON faqs FOR ALL USING (is_admin());

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- service role 전용

ALTER TABLE bot_tasks ENABLE ROW LEVEL SECURITY;
-- service role 전용 (봇 워커와 관리자 API만 접근)
CREATE POLICY "bot_tasks_admin_select" ON bot_tasks
  FOR SELECT USING (is_admin());
```

---

### `supabase/migrations/003_functions.sql`

```sql
-- 조회수 원자적 증가
CREATE OR REPLACE FUNCTION increment_post_views(p_post_id INTEGER)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE posts SET views = views + 1 WHERE id = p_post_id;
$$;

-- 다운로드 카운트 원자적 증가 + 로그
CREATE OR REPLACE FUNCTION increment_resource_download(
  p_resource_id INTEGER,
  p_user_id UUID DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE resources SET download_count = download_count + 1 WHERE id = p_resource_id;
  INSERT INTO resource_downloads (resource_id, user_id, ip_hash)
  VALUES (p_resource_id, p_user_id, p_ip_hash);
END;
$$;

-- 봇 태스크 atomic claim (FOR UPDATE SKIP LOCKED)
CREATE OR REPLACE FUNCTION claim_bot_task(p_worker_id TEXT)
RETURNS SETOF bot_tasks LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH next_task AS (
    SELECT id FROM bot_tasks
    WHERE status = 'pending'
      AND scheduled_at <= NOW()
      AND attempts < max_attempts
    ORDER BY priority ASC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  UPDATE bot_tasks t
  SET
    status       = 'claimed',
    worker_id    = p_worker_id,
    claimed_at   = NOW(),
    heartbeat_at = NOW(),
    attempts     = attempts + 1
  FROM next_task
  WHERE t.id = next_task.id
  RETURNING t.*;
END;
$$;

-- stuck task 복구 (claimed 상태로 10분 이상 heartbeat 없는 태스크를 pending으로)
CREATE OR REPLACE FUNCTION recover_stuck_bot_tasks()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE recovered INTEGER;
BEGIN
  WITH recovered_tasks AS (
    UPDATE bot_tasks
    SET status = 'pending', worker_id = NULL, claimed_at = NULL
    WHERE status = 'claimed'
      AND heartbeat_at < NOW() - INTERVAL '10 minutes'
      AND attempts < max_attempts
    RETURNING id
  )
  SELECT COUNT(*) INTO recovered FROM recovered_tasks;
  RETURN recovered;
END;
$$;

-- 관리자 감사 로그 기록
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_table TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_meta JSONB DEFAULT NULL
)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO audit_logs (admin_id, action, target_table, target_id, meta)
  VALUES (auth.uid(), p_action, p_table, p_target_id, p_meta);
$$;
```

---

### `supabase/migrations/004_seed_dev.sql`

```sql
-- 개발·데모용 시드 데이터 (production에서는 실행 금지)
INSERT INTO courses (title, slug, description, category, difficulty, tier, published, sort_order) VALUES
  ('바이브코딩 환경 세팅', 'vibe-coding-setup', 'VS Code + Claude Code + nvm을 5분 만에 구축한다', 'vibe-coding', 'beginner', 'free', true, 1),
  ('Claude CLI 비대화식 실행', 'claude-cli-noninteractive', 'API 키 없이 구독으로 Claude를 자동화 파이프라인에 투입한다', 'claude-cli', 'intermediate', 'free', true, 2),
  ('24시간 자동화봇 구조', 'autobot-architecture', 'daemon_service + relay + worker 3-tier 구조를 이해한다', 'autobot', 'intermediate', 'premium', true, 3),
  ('Vercel + Supabase 기초', 'vercel-supabase-basics', '$0 SaaS 인프라를 30분 만에 세팅한다', 'saas-infra', 'beginner', 'free', true, 4),
  ('Google OAuth + 프로필 자동 생성', 'google-oauth-profile', 'Supabase Auth + trigger로 5분 만에 로그인 시스템을 만든다', 'google-auth', 'beginner', 'free', true, 5),
  ('Cloudflare R2 파일 관리', 'cloudflare-r2-files', 'egress 무료 R2에 파일을 올리고 presigned URL로 안전하게 제공한다', 'saas-infra', 'intermediate', 'premium', true, 6);

INSERT INTO faqs (question, answer, category, sort_order) VALUES
  ('무료 강의는 어디서 볼 수 있나요?', '상단 메뉴의 [무료강의]에서 바로 수강할 수 있습니다.', 'enrollment', 1),
  ('멤버십 결제는 어떻게 하나요?', '현재 베타 기간 중으로 관리자가 수동으로 멤버십을 부여합니다. 커뮤니티 Q&A에 문의해주세요.', 'membership', 2),
  ('강의 자료는 어디서 받나요?', '[자료실] 메뉴에서 강의별 소스코드와 템플릿을 다운로드할 수 있습니다. 프리미엄 자료는 멤버십이 필요합니다.', 'content', 3),
  ('Claude Code 없이 수강할 수 있나요?', '네. 강의는 개념 이해 위주로 구성되어 있습니다. Claude Pro/Max 구독이 있으면 실습까지 가능합니다.', 'content', 4),
  ('Oracle Cloud 계정이 꼭 필요한가요?', '봇 운영 실습을 위해서는 필요합니다. Oracle Cloud Always Free 계정(신용카드 필요)으로 무료로 이용할 수 있습니다.', 'technical', 5);
```

---

## 4. 환경변수

### `frontend/.env.local.example`

```env
# ── Public (브라우저에서 접근 가능) ──────────────────────
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# ── Server only (절대 NEXT_PUBLIC_ 붙이지 말 것) ──────────
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Cloudflare R2 (private bucket)
R2_ACCOUNT_ID=xxxx
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
R2_BUCKET_NAME=ddkker
R2_PUBLIC_BASE_URL=https://pub-xxxx.r2.dev   # 공개 이미지용 prefix (썸네일 등)

# Rate limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxx

# 이메일 (Resend)
RESEND_API_KEY=re_xxxx
RESEND_FROM=noreply@ddkker.com

# OAuth
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx
KAKAO_CLIENT_ID=xxxx            # 2차 구현 시 활성화
KAKAO_CLIENT_SECRET=xxxx        # 2차 구현 시 활성화

# 봇 공유 시크릿 (관리자 API 인증용)
BOT_SHARED_SECRET=xxxx
```

### `bot/.env.example`

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

CLAUDE_CLI=/home/ubuntu/.npm-global/bin/claude
CODEX_CLI=/home/ubuntu/.npm-global/bin/codex

R2_ACCOUNT_ID=xxxx
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
R2_BUCKET_NAME=ddkker
R2_PUBLIC_BASE_URL=https://pub-xxxx.r2.dev

WORKER_ID=oracle-arm-01
WORKER_POLL_INTERVAL_SEC=60
WORKER_HEARTBEAT_INTERVAL_SEC=30

# 실패 알림 (002.DDKKBOT Telegram 패턴 활용)
TELEGRAM_BOT_TOKEN=xxxx
TELEGRAM_ALERT_CHAT_ID=xxxx
```

---

## 5. `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google 프로필
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: [process.env.NEXT_PUBLIC_SITE_URL ?? ""] },
  },
};

export default nextConfig;
```

---

## 6. 서버 전용 모듈

### `src/lib/server/admin-client.ts`

```typescript
import "server-only";
import { createClient } from "@supabase/supabase-js";

// service role 클라이언트는 이 모듈에서만 생성
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### `src/lib/server/authz.ts`

```typescript
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "./admin-client";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  const { data } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .single();
  if (!data) redirect("/");
  return user;
}

export async function hasActiveMembership(userId: string): Promise<boolean> {
  const { data } = await adminClient
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .limit(1)
    .single();
  return !!data;
}
```

### `src/lib/server/r2.ts`

```typescript
import "server-only";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 60
): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });
  return getSignedUrl(R2, cmd, { expiresIn });
}
```

### `src/lib/server/bot.ts`

```typescript
import "server-only";
import { adminClient } from "./admin-client";

type TaskType = "thumbnail" | "qa-assist" | "notification";

export async function enqueueBotTask(
  type: TaskType,
  payload: Record<string, unknown>,
  options?: { priority?: number; idempotencyKey?: string; scheduledAt?: Date }
) {
  const { error } = await adminClient.from("bot_tasks").insert({
    task_type: type,
    payload,
    priority: options?.priority ?? 0,
    idempotency_key: options?.idempotencyKey,
    scheduled_at: options?.scheduledAt?.toISOString(),
  });
  if (error) throw new Error(`봇 태스크 큐잉 실패: ${error.message}`);
}
```

### `src/lib/ratelimit.ts`

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();

export const downloadRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),  // 1시간에 10회
  prefix: "rl:download",
});

export const postRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),   // 10분에 5건
  prefix: "rl:post",
});

export async function checkRateLimit(
  req: NextRequest,
  limiter: Ratelimit
): Promise<NextResponse | null> {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await limiter.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }
  return null;
}
```

---

## 7. 핵심 Route Handler

### `src/app/api/resources/download/[id]/route.ts`

```typescript
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/server/admin-client";
import { getPresignedDownloadUrl } from "@/lib/server/r2";
import { hasActiveMembership } from "@/lib/server/authz";
import { downloadRatelimit, checkRateLimit } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limit
  const rateLimitError = await checkRateLimit(req, downloadRatelimit);
  if (rateLimitError) return rateLimitError;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 자료 조회 (file_key는 클라이언트에 반환하지 않음)
  const { data: resource } = await adminClient
    .from("resources")
    .select("id, title, file_key, file_type, tier, published")
    .eq("id", params.id)
    .single();

  if (!resource?.published) {
    return NextResponse.json({ error: "찾을 수 없습니다" }, { status: 404 });
  }

  // 권한 확인
  if (resource.tier === "premium") {
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }
    const isMember = await hasActiveMembership(user.id);
    if (!isMember) {
      return NextResponse.json({ error: "멤버십이 필요합니다" }, { status: 403 });
    }
  }

  // 다운로드 로그 + 카운트 (원자적 RPC)
  const ip = req.headers.get("x-forwarded-for") ?? "";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
  await adminClient.rpc("increment_resource_download", {
    p_resource_id: resource.id,
    p_user_id: user?.id ?? null,
    p_ip_hash: ipHash,
  });

  // Presigned URL 발급 (60초 유효)
  const url = await getPresignedDownloadUrl(resource.file_key!, 60);
  return NextResponse.redirect(url);
}
```

### `src/app/api/posts/route.ts`

```typescript
import { createClient } from "@/lib/supabase/server";
import { postRatelimit, checkRateLimit } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const rateLimitError = await checkRateLimit(req, postRatelimit);
  if (rateLimitError) return rateLimitError;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await req.json();
  const { board, title, content } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 입력하세요" }, { status: 400 });
  }

  // user_id는 서버 세션에서 주입 (클라이언트 입력 무시)
  const { data, error } = await supabase
    .from("posts")
    .insert({ board, title: title.trim(), content: content.trim(), user_id: user.id })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
```

---

## 8. Tailwind 설정

### `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas:    "#faf9f5",
        primary:   "#5B4FD9",
        "primary-active":   "#4338CA",
        "primary-disabled": "#E5E4F5",
        ink:       "#141413",
        body:      "#3d3d3a",
        muted:     "#6c6a64",
        "muted-soft": "#8e8b82",
        hairline:  "#e6dfd8",
        "hairline-soft": "#ebe6df",
        "surface-soft":  "#f5f0e8",
        "surface-card":  "#efe9de",
        "surface-cream-strong": "#e8e0d2",
        "surface-dark":  "#181715",
        "surface-dark-elevated": "#252320",
        "surface-dark-soft": "#1f1e1b",
        "on-primary": "#ffffff",
        "on-dark":    "#faf9f5",
        "on-dark-soft": "#a09d96",
        success:      "#5db872",
        "accent-teal":  "#5db8a6",
        "accent-amber": "#e8a55a",
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', '"Noto Serif"', "Georgia", "serif"],
        sans:  ["Pretendard", "-apple-system", '"Apple SD Gothic Neo"', "sans-serif"],
        mono:  ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      fontSize: {
        "display-xl": ["56px", { lineHeight: "1.1",  letterSpacing: "-1.2px" }],
        "display-lg": ["44px", { lineHeight: "1.15", letterSpacing: "-0.8px" }],
        "display-md": ["34px", { lineHeight: "1.2",  letterSpacing: "-0.4px" }],
        "display-sm": ["26px", { lineHeight: "1.25", letterSpacing: "-0.2px" }],
        "title-lg":   ["20px", { lineHeight: "1.35" }],
        "title-md":   ["17px", { lineHeight: "1.4"  }],
        "title-sm":   ["15px", { lineHeight: "1.4"  }],
      },
      spacing: { section: "96px" },
      borderRadius: { pill: "9999px" },
    },
  },
  plugins: [typography],
};
export default config;
```

---

## 9. 공통 컴포넌트

### `src/components/ui/Button.tsx`

```typescript
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "secondary-dark" | "text";
  size?: "md" | "lg";
  href?: string;
};

export function Button({
  variant = "primary", size = "md", href,
  className, children, ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { md: "h-10 px-5 text-sm", lg: "h-12 px-7 text-base" };
  const variants = {
    primary:          "bg-primary text-white hover:bg-primary-active",
    secondary:        "bg-canvas text-ink border border-hairline hover:bg-surface-soft",
    "secondary-dark": "bg-surface-dark-elevated text-on-dark hover:bg-surface-dark",
    text:             "text-primary hover:underline",
  };
  const cls = cn(base, sizes[size], variants[variant], className);

  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button className={cls} {...props}>{children}</button>;
}
```

### `src/components/ui/Badge.tsx`

```typescript
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "free" | "beginner" | "intermediate" | "advanced";

const STYLES: Record<BadgeVariant, string> = {
  default:      "bg-surface-card text-ink",
  primary:      "bg-primary text-white",
  free:         "bg-success text-white",
  beginner:     "bg-accent-teal text-white",
  intermediate: "bg-accent-amber text-white",
  advanced:     "bg-primary text-white",
};

export function Badge({ variant = "default", children, className }: {
  variant?: BadgeVariant; children: React.ReactNode; className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-semibold uppercase tracking-wide",
      STYLES[variant], className
    )}>
      {children}
    </span>
  );
}
```

### `src/components/ui/CodeWindow.tsx`

```typescript
export function CodeWindow({
  title = "terminal",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-surface-dark overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-dark-elevated">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-3 text-xs text-on-dark-soft font-mono">{title}</span>
      </div>
      <div className="p-6 overflow-x-auto">
        <pre className="font-mono text-sm text-on-dark leading-relaxed whitespace-pre">
          {children}
        </pre>
      </div>
    </div>
  );
}
```

---

## 10. 봇 워커

### `bot/worker.py`

```python
"""
ddkkbot 사이트 연동 워커
Supabase bot_tasks 테이블을 큐로 사용 (krc_worker.py 패턴 기반)
"""
import os, sys, json, time, subprocess, re, uuid, hashlib, logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client, Client
import boto3
from botocore.config import Config
import requests  # Telegram 알림용

# ── 설정 ──────────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
CLAUDE_CLI   = os.environ.get("CLAUDE_CLI", "claude")
CODEX_CLI    = os.environ.get("CODEX_CLI", "codex")
WORKER_ID    = os.environ.get("WORKER_ID", f"worker-{uuid.uuid4().hex[:8]}")
POLL_SEC     = int(os.environ.get("WORKER_POLL_INTERVAL_SEC", "60"))
HB_SEC       = int(os.environ.get("WORKER_HEARTBEAT_INTERVAL_SEC", "30"))

R2_ACCOUNT   = os.environ["R2_ACCOUNT_ID"]
R2_KEY       = os.environ["R2_ACCESS_KEY_ID"]
R2_SECRET    = os.environ["R2_SECRET_ACCESS_KEY"]
R2_BUCKET    = os.environ["R2_BUCKET_NAME"]
R2_PUBLIC    = os.environ.get("R2_PUBLIC_BASE_URL", "")

TG_TOKEN     = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TG_CHAT      = os.environ.get("TELEGRAM_ALERT_CHAT_ID", "")

WORK_DIR     = Path(__file__).parent

# ── 로깅 ──────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(WORK_DIR / "logs" / "worker.log", encoding="utf-8"),
    ]
)
log = logging.getLogger("ddkkbot")

db: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TASK_CONCURRENCY = {
    "thumbnail":    1,
    "qa-assist":    2,
    "notification": 3,
}

# ── AI 실행 헬퍼 ──────────────────────────────────────────────────────────────

def run_claude(prompt: str, timeout: int = 180) -> str:
    result = subprocess.run(
        [CLAUDE_CLI, "-p", prompt, "--output-format", "text"],
        capture_output=True, text=True, timeout=timeout,
        stdin=subprocess.DEVNULL, cwd=str(WORK_DIR),
    )
    if result.returncode != 0:
        raise RuntimeError(f"Claude 실패: {result.stderr[:300]}")
    return result.stdout.strip()


def run_codex(prompt: str, timeout: int = 600) -> str:
    result = subprocess.run(
        [CODEX_CLI, "exec", "--sandbox", "workspace-write",
         "--skip-git-repo-check", prompt],
        capture_output=True, text=True, timeout=timeout,
        stdin=subprocess.DEVNULL, cwd=str(WORK_DIR),
    )
    if result.returncode != 0:
        raise RuntimeError(f"Codex 실패: {result.stderr[:300]}")
    return result.stdout.strip()


def upload_r2(file_path: str, object_key: str, content_type: str = "image/png") -> str:
    s3 = boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_KEY,
        aws_secret_access_key=R2_SECRET,
        config=Config(signature_version="s3v4", region_name="auto"),
    )
    s3.upload_file(file_path, R2_BUCKET, object_key,
                   ExtraArgs={"ContentType": content_type})
    return object_key


def extract_json(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError("JSON을 찾을 수 없음")


def send_telegram_alert(message: str):
    """실패 등 운영 알림을 Telegram으로 전송 (002.DDKKBOT 패턴)"""
    if not TG_TOKEN or not TG_CHAT:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
            json={"chat_id": TG_CHAT, "text": f"[ddkkbot] {message}"},
            timeout=5,
        )
    except Exception:
        pass

# ── 태스크 핸들러 ─────────────────────────────────────────────────────────────

def handle_thumbnail(task: dict) -> dict:
    """Codex $Imagegen으로 강의 썸네일 생성 → R2 업로드 → courses 테이블 업데이트"""
    payload   = task["payload"] or {}
    title     = payload.get("title", "강의 썸네일")
    course_id = payload.get("course_id")

    image_path = f"/tmp/thumbnail_{course_id}_{task['id']}.png"
    run_codex(f"""
$Imagegen 아래 강의의 썸네일 이미지를 만들어줘.
생성된 이미지를 {image_path} 에 저장해.

강의 제목: {title}
스타일: 모던 테크 스타일. 인디고(#5B4FD9)와 크림(#faf9f5) 컬러. 
       상단에 강의 제목을 한국어로 크게 표시. 우측 하단에 작은 ▌ 아이콘.
크기: 1280x720 (16:9).
""")

    object_key = f"thumbnails/course_{course_id}.png"
    upload_r2(image_path, object_key)

    thumbnail_url = f"{R2_PUBLIC}/{object_key}" if R2_PUBLIC else object_key
    db.table("courses").update({"thumbnail_url": thumbnail_url}) \
      .eq("id", course_id).execute()

    log.info(f"썸네일 생성 완료: course_id={course_id}")
    return {"thumbnail_url": thumbnail_url}


def handle_qa_assist(task: dict) -> dict:
    """Claude CLI로 Q&A 게시글 AI 답변 초안 생성 → 댓글로 등록"""
    payload  = task["payload"] or {}
    post_id  = payload.get("post_id")
    question = f"{payload.get('title','')}\n\n{payload.get('content','')}"

    answer = run_claude(f"""
다음 바이브코딩/SaaS 관련 질문에 한국어로 답변해줘.
답변은 명확하고 실용적으로, 코드가 필요하면 코드블록으로 작성해.
확실하지 않은 내용은 "확인이 필요합니다"라고 명시해.

질문:
{question}
""")

    # 봇 계정 profiles row가 있어야 함 (setup 시 수동 생성)
    bot_user_id = os.environ.get("BOT_USER_ID")
    if bot_user_id:
        db.table("comments").insert({
            "post_id": post_id,
            "user_id": bot_user_id,
            "content": f"🤖 AI 답변 초안:\n\n{answer}",
        }).execute()

    return {"answer_preview": answer[:200]}


HANDLERS = {
    "thumbnail": handle_thumbnail,
    "qa-assist": handle_qa_assist,
}

# ── 큐 폴링 ───────────────────────────────────────────────────────────────────

def claim_task() -> dict | None:
    """atomic claim (FOR UPDATE SKIP LOCKED RPC)"""
    result = db.rpc("claim_bot_task", {"p_worker_id": WORKER_ID}).execute()
    rows = result.data
    return rows[0] if rows else None


def complete_task(task_id: int, result: dict):
    db.table("bot_tasks").update({
        "status": "done",
        "result": result,
    }).eq("id", task_id).execute()


def fail_task(task_id: int, error: str, attempts: int, max_attempts: int):
    if attempts < max_attempts:
        db.table("bot_tasks").update({
            "status": "pending",
            "error": error,
            "worker_id": None,
            "claimed_at": None,
        }).eq("id", task_id).execute()
    else:
        db.table("bot_tasks").update({
            "status": "failed",
            "error": error,
        }).eq("id", task_id).execute()
        send_telegram_alert(f"태스크 최종 실패 task_id={task_id}: {error[:100]}")


def update_heartbeat(task_id: int):
    db.table("bot_tasks").update({"heartbeat_at": "now()"}).eq("id", task_id).execute()


def run_one_task():
    task = claim_task()
    if not task:
        return False

    task_id   = task["id"]
    task_type = task["task_type"]
    handler   = HANDLERS.get(task_type)

    if not handler:
        fail_task(task_id, f"알 수 없는 task_type: {task_type}", task["attempts"], task["max_attempts"])
        return True

    try:
        result = handler(task)
        complete_task(task_id, result)
        log.info(f"✓ task {task_id} ({task_type}) 완료")
    except Exception as e:
        err = str(e)[:500]
        log.error(f"✗ task {task_id} ({task_type}) 실패: {err}")
        fail_task(task_id, err, task["attempts"], task["max_attempts"])

    return True


def main():
    (WORK_DIR / "logs").mkdir(exist_ok=True)
    log.info(f"ddkkbot worker 시작 — id={WORKER_ID}, poll={POLL_SEC}s")

    consecutive_errors = 0

    while True:
        try:
            processed = run_one_task()
            consecutive_errors = 0
            if processed:
                continue   # 처리 건수 있으면 즉시 다음 사이클
        except Exception as e:
            consecutive_errors += 1
            log.error(f"워커 오류 ({consecutive_errors}회 연속): {e}")
            if consecutive_errors >= 5:
                send_telegram_alert(f"워커 연속 오류 {consecutive_errors}회: {e}")

        time.sleep(POLL_SEC)


if __name__ == "__main__":
    main()
```

---

### `bot/systemd/ddkkbot.service`

```ini
[Unit]
Description=ddkkbot Task Worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/ddkkbot
EnvironmentFile=/opt/ddkkbot/.env
ExecStart=/opt/ddkkbot/.venv/bin/python worker.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

---

### `bot/scripts/setup_oracle.sh`

```bash
#!/bin/bash
# Oracle Cloud ARM VM (Ubuntu 22.04) 초기 세팅
# sudo ./scripts/setup_oracle.sh

set -euo pipefail

BOT_USER="ubuntu"
BOT_DIR="/opt/ddkkbot"

echo "=== [1/9] 패키지 업데이트 ==="
apt-get update -y && apt-get upgrade -y
apt-get install -y python3.11 python3.11-venv python3-pip git curl wget unzip

echo "=== [2/9] Node.js (nvm) 설치 ==="
sudo -u "$BOT_USER" bash -c '
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  source "$NVM_DIR/nvm.sh"
  nvm install --lts
  node --version
  npm --version
'

echo "=== [3/9] npm 글로벌 경로 설정 ==="
sudo -u "$BOT_USER" bash -c '
  mkdir -p ~/.npm-global
  npm config set prefix ~/.npm-global
  echo "export PATH=~/.npm-global/bin:$PATH" >> ~/.bashrc
'

echo "=== [4/9] Claude Code + Codex CLI 설치 ==="
sudo -u "$BOT_USER" bash -c '
  export PATH="$HOME/.npm-global/bin:$PATH"
  npm install -g @anthropic-ai/claude-code
  npm install -g @openai/codex
  echo "설치 완료. 아래 명령으로 각각 로그인 필요:"
  echo "  claude login"
  echo "  codex login"
'

echo "=== [5/9] 봇 디렉토리 준비 ==="
mkdir -p "$BOT_DIR/logs"
chown -R "$BOT_USER":"$BOT_USER" "$BOT_DIR"

echo "=== [6/9] 코드 복사 (이 단계에서 /opt/ddkkbot에 worker.py 등이 있어야 함) ==="
echo "git clone 또는 scp로 봇 코드를 $BOT_DIR 에 복사하고 아래를 실행하세요:"
echo "  sudo -u ubuntu bash -c 'cd $BOT_DIR && cp .env.example .env && nano .env'"

echo "=== [7/9] Python 가상환경 ==="
sudo -u "$BOT_USER" bash -c "
  python3.11 -m venv $BOT_DIR/.venv
  $BOT_DIR/.venv/bin/pip install -r $BOT_DIR/requirements.txt
"

echo "=== [8/9] Oracle Cloud 방화벽 (iptables) ==="
# Oracle Cloud VM의 기본 iptables는 인바운드를 모두 차단
# 봇은 아웃바운드만 필요 (Supabase, Telegram, R2, Claude/Codex API)
# 인바운드는 기본값 유지 (SSH 22만 허용)
echo "아웃바운드는 기본 허용. 인바운드 추가 열기 불필요 (봇은 아웃바운드만 사용)."

echo "=== [9/9] systemd 서비스 등록 ==="
cp "$BOT_DIR/systemd/ddkkbot.service" /etc/systemd/system/ddkkbot.service
systemctl daemon-reload
systemctl enable ddkkbot
echo ""
echo "✅ 세팅 완료."
echo "   .env 파일 설정 후 'systemctl start ddkkbot' 실행"
echo "   상태 확인: systemctl status ddkkbot"
echo "   로그 확인: journalctl -u ddkkbot -f"
```

---

## 11. 관리자 CMS 핵심

### 관리자 레이아웃 보호

```typescript
// src/app/admin/layout.tsx
import { requireAdmin } from "@/lib/server/authz";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();  // 관리자 아니면 홈으로 redirect
  return (
    <div className="min-h-screen bg-surface-soft">
      <div className="bg-surface-dark text-on-dark px-6 py-3 text-sm font-medium">
        딸깍러 관리자
      </div>
      <div className="max-w-[1200px] mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
```

### 봇 태스크 관리자 패널 핵심

```typescript
// src/app/admin/bot-tasks/page.tsx
import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { enqueueBotTask } from "@/lib/server/bot";
import { revalidatePath } from "next/cache";

async function createThumbnailTask(courseId: number, title: string) {
  "use server";
  await requireAdmin();
  await enqueueBotTask("thumbnail", { course_id: courseId, title }, {
    idempotencyKey: `thumbnail-course-${courseId}-${Date.now()}`,
  });
  revalidatePath("/admin/bot-tasks");
}

export default async function BotTasksPage() {
  await requireAdmin();

  const { data: tasks } = await adminClient
    .from("bot_tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: courses } = await adminClient
    .from("courses")
    .select("id, title, thumbnail_url")
    .eq("published", true)
    .order("sort_order");

  return (
    <div>
      <h1 className="text-display-md font-serif text-ink mb-8">봇 태스크</h1>

      {/* 썸네일 생성 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6 mb-8">
        <h2 className="text-title-md font-semibold text-ink mb-4">썸네일 생성 요청</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {(courses ?? []).map(c => (
            <div key={c.id} className="border border-hairline rounded-lg p-4">
              <p className="text-sm font-medium text-ink mb-2 line-clamp-2">{c.title}</p>
              {c.thumbnail_url
                ? <p className="text-xs text-success mb-2">✓ 썸네일 있음</p>
                : <p className="text-xs text-muted mb-2">썸네일 없음</p>
              }
              <form action={createThumbnailTask.bind(null, c.id, c.title)}>
                <button type="submit"
                  className="text-xs text-primary hover:text-primary-active font-medium">
                  {c.thumbnail_url ? "재생성 요청" : "생성 요청"} →
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* 태스크 로그 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6">
        <h2 className="text-title-md font-semibold text-ink mb-4">태스크 로그</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-muted">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">유형</th>
                <th className="pb-3 pr-4">상태</th>
                <th className="pb-3 pr-4">시도</th>
                <th className="pb-3">생성일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {(tasks ?? []).map(t => (
                <tr key={t.id}>
                  <td className="py-3 pr-4 text-muted">{t.id}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{t.task_type}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-pill text-xs font-semibold uppercase ${
                      t.status === "done"    ? "bg-success/10 text-success" :
                      t.status === "failed"  ? "bg-red-100 text-red-600" :
                      t.status === "claimed" ? "bg-accent-amber/20 text-amber-700" :
                                               "bg-surface-card text-muted"
                    }`}>{t.status}</span>
                  </td>
                  <td className="py-3 pr-4 text-muted">{t.attempts}/{t.max_attempts}</td>
                  <td className="py-3 text-muted text-xs">
                    {new Date(t.created_at).toLocaleString("ko")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
```

---

## 12. SEO + 법률 페이지

### `src/app/sitemap.ts`

```typescript
import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("slug, updated_at")
    .eq("published", true);

  const staticRoutes = ["/", "/courses", "/membership", "/resources",
                        "/community", "/faq", "/youtube", "/privacy", "/terms"];

  return [
    ...staticRoutes.map(url => ({
      url: `${process.env.NEXT_PUBLIC_SITE_URL}${url}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: url === "/" ? 1 : 0.8,
    })),
    ...(courses ?? []).map(c => ({
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/courses/${c.slug}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
```

### `src/app/layout.tsx` — OG 메타데이터

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "딸깍러", template: "%s | 딸깍러" },
  description: "AI와 대화만으로 SaaS를 만든다 — 바이브코딩 강의 플랫폼",
  openGraph: {
    title: "딸깍러",
    description: "코드 한 줄 없이 바이브코딩으로 SaaS를 만드는 강의",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "딸깍러",
    locale: "ko_KR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};
```

### `src/app/privacy/page.tsx` (법적 필수 — 한국 정보통신망법)

```typescript
export default function PrivacyPage() {
  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[800px] mx-auto px-6 py-16 prose prose-sm">
        <h1 className="font-serif font-normal text-display-md text-ink">개인정보처리방침</h1>
        <p className="text-muted">최종 수정일: 2026년 5월 1일</p>

        <h2>1. 수집하는 개인정보</h2>
        <p>Google 소셜 로그인 시 이름, 이메일, 프로필 사진을 수집합니다.</p>

        <h2>2. 개인정보의 이용 목적</h2>
        <p>서비스 제공, 회원 관리, 멤버십 운영에 사용합니다.</p>

        <h2>3. 보유 및 이용 기간</h2>
        <p>회원 탈퇴 시까지 보관하며, 탈퇴 즉시 파기합니다.</p>

        <h2>4. 개인정보의 제3자 제공</h2>
        <p>법령에 의한 경우를 제외하고 제3자에게 제공하지 않습니다.</p>

        <h2>5. 이용자의 권리</h2>
        <p>언제든지 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.</p>

        <h2>6. 문의</h2>
        <p>개인정보 관련 문의: 커뮤니티 Q&A 게시판을 이용해주세요.</p>
      </div>
    </main>
  );
}
```

---

## 13. ISR 캐시 전략

자주 바뀌지 않는 페이지에 `revalidate` 설정으로 Supabase 호출 최소화:

```typescript
// 강의 목록: 5분 캐시
export const revalidate = 300;

// FAQ: 1시간 캐시
export const revalidate = 3600;

// 홈 (최신 강의 포함): 5분 캐시
export const revalidate = 300;

// 관리자 CMS: 캐시 없음
export const revalidate = 0;

// 커뮤니티: 30초 캐시
export const revalidate = 30;
```

---

## 14. 카카오 로그인 (2차 — Google 안정화 후)

구현 전 결정사항:

- Supabase Auth에서 Kakao를 custom OIDC로 지원하는지 최신 버전 확인
- 불가 시: 커스텀 OAuth2 플로우 (별도 Edge Function 또는 Route Handler)
- 계정 연결 기준: email이 있으면 email 기준, 없으면 `kakao_{kakao_id}@ddkker.local` 형태의 내부 이메일
- `admin.listUsers()` 전체 스캔 금지 → `getUserById` 또는 email index 조회 사용
- `state` cookie: `httpOnly: true, secure: true, sameSite: "lax", maxAge: 600`
- 가짜 이메일 도메인 사용 시 계정 병합 정책 문서화 후 시작
- 구현은 `auth-kakao` 브랜치에서 별도 진행

---

## 15. 결제 (2차 — 수동 멤버십 검증 후)

1차는 관리자가 `/admin/members`에서 수동으로 `memberships` row를 INSERT.

2차 추가 테이블:

```sql
CREATE TABLE payment_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  provider TEXT,          -- 'toss' | 'stripe'
  event_type TEXT,        -- 'payment.completed' | 'subscription.canceled' | etc.
  amount INTEGER,
  currency TEXT DEFAULT 'KRW',
  raw_payload JSONB,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

원칙:
- 웹훅이 권한 부여의 source of truth
- 클라이언트 성공 페이지는 직접 권한 부여 금지
- 동일 웹훅 중복 수신 시 idempotency_key로 한 번만 처리

---

## 16. 단계별 실행 계획

### Phase 0: 기반 확정 (½일)

- [ ] `frontend/src` 구조로 Next.js 생성
- [ ] Tailwind 토큰 반영 + 폰트 로드
- [ ] `.env.local.example` 작성
- [ ] `next.config.ts` remotePatterns 등록
- [ ] MVP 범위 확정, 관리자 이메일 1개 확정

완료 기준: `npm run dev`로 빈 홈이 크림 배경에 렌더링된다.

### Phase 1: DB 스키마 + RLS (½일)

- [ ] `001_schema.sql` 작성 + `supabase db push`
- [ ] `002_rls.sql` 작성 + 적용
- [ ] `003_functions.sql` 작성 + 적용
- [ ] `004_seed_dev.sql` 시드 데이터 삽입
- [ ] Supabase 대시보드에서 RLS 활성화 확인

완료 기준: 익명 사용자가 premium lesson 본문을 SELECT할 수 없다.

### Phase 2: 서버 유틸 + 공통 UI (½일)

- [ ] `lib/server/admin-client.ts` (server-only)
- [ ] `lib/server/authz.ts` (requireAdmin, hasActiveMembership)
- [ ] `lib/server/r2.ts`
- [ ] `lib/server/bot.ts`
- [ ] `lib/ratelimit.ts` (Upstash)
- [ ] Button, Badge, CodeWindow, Tabs, Container
- [ ] TopNav, Footer
- [ ] `lib/utils.ts` (cn)

완료 기준: `npm run type-check` 통과.

### Phase 3: 인증 (½일)

- [ ] Supabase Google provider 활성화
- [ ] `app/auth/callback/route.ts`
- [ ] `middleware.ts`
- [ ] 프로필 자동 생성 trigger (`003_functions.sql`의 handle_new_user)
- [ ] TopNav 로그인 상태 표시

완료 기준: 로그인 → profiles row 생성, 새로고침 후 세션 유지.

### Phase 4: 공개 콘텐츠 페이지 (1~2일)

순서: 홈 → 강의목록 → 강의상세 → 멤버십 → 자료실 → FAQ → YouTube  
각 페이지 완료 기준: 빈 데이터 상태에서도 깨지지 않고 렌더링됨.

- [ ] `app/page.tsx` (홈 — Hero + FeatureCards + 인디고 콜아웃)
- [ ] `app/courses/page.tsx` (필터 탭 + CourseGrid, ISR 300s)
- [ ] `app/courses/[slug]/page.tsx` (강의 상세 + lessons 목록)
- [ ] `app/membership/page.tsx` (PricingTiers + FAQ)
- [ ] `app/resources/page.tsx` (카테고리 탭 + 카드 그리드)
- [ ] `app/faq/page.tsx` (FaqAccordion, ISR 3600s)
- [ ] `app/youtube/page.tsx` (YouTube Unlisted 임베드)
- [ ] `app/privacy/page.tsx` + `app/terms/page.tsx`
- [ ] `app/sitemap.ts`
- [ ] `app/not-found.tsx`, `app/error.tsx`, `app/loading.tsx`

### Phase 5: 관리자 CMS (1일)

- [ ] `app/admin/layout.tsx` (requireAdmin 보호)
- [ ] `app/admin/page.tsx` (요약 대시보드)
- [ ] `app/admin/courses/page.tsx` (강의 목록 + 등록/수정/공개)
- [ ] `app/admin/resources/page.tsx` (자료 메타 등록 + R2 key 연결)
- [ ] `app/admin/faqs/page.tsx` (FAQ 등록/정렬)
- [ ] `app/admin/members/page.tsx` (멤버십 수동 부여/취소)
- [ ] `app/admin/bot-tasks/page.tsx` (썸네일 생성 요청 + 로그 확인)
- [ ] 모든 관리자 변경에 `audit_logs` 기록

완료 기준: 관리자가 강의를 등록하면 공개 페이지에서 바로 확인 가능.

### Phase 6: 다운로드 게이트 (½일)

- [ ] `app/api/resources/download/[id]/route.ts` (Rate limit + 권한 + presigned URL)
- [ ] `increment_resource_download` RPC 적용
- [ ] `resource_downloads` 로그 확인

완료 기준 (케이스별):
- 비회원 + 무료 자료 → 다운로드 성공
- 비회원 + 프리미엄 자료 → 401
- 무료 회원 + 프리미엄 자료 → 403
- 멤버십 회원 + 프리미엄 자료 → presigned URL 리다이렉트

### Phase 7: 커뮤니티 (½일)

- [ ] `app/community/page.tsx` (게시판 탭 + 목록)
- [ ] `app/community/[id]/page.tsx` (상세 + 댓글)
- [ ] `app/community/new/page.tsx` (글쓰기)
- [ ] `app/api/posts/route.ts` (Rate limit + user_id 서버 주입)
- [ ] `app/api/comments/route.ts`
- [ ] XSS 방지: MVP는 plain text + `\n` → `<br>`, 마크다운은 2차

완료 기준: 다른 사용자 ID로 게시글 작성이 RLS에서 차단됨.

### Phase 8: 봇 + Oracle Cloud (1일)

- [ ] `bot/worker.py` 작성 (claim_bot_task RPC 사용)
- [ ] `bot/requirements.txt`: supabase, boto3, python-dotenv, requests
- [ ] `bot/systemd/ddkkbot.service`
- [ ] `bot/scripts/setup_oracle.sh`
- [ ] Oracle Cloud ARM VM 생성 + 세팅
- [ ] Claude CLI + Codex CLI 로그인 완료
- [ ] `.env` 배치 + systemd 등록
- [ ] 테스트: 관리자에서 thumbnail 태스크 큐잉 → 봇 처리 → `courses.thumbnail_url` 업데이트 확인

완료 기준: pending → claimed → done 흐름 확인, 실패 시 Telegram 알림 수신.

### Phase 9: 배포 (½일)

- [ ] Vercel project 연결 (root directory: `frontend`)
- [ ] 환경변수 등록 (production/preview 분리)
- [ ] Supabase Auth redirect URL 등록 (`https://ddkker.com/auth/callback`)
- [ ] Kakao Developers redirect URI 등록 (2차 시)
- [ ] R2 bucket CORS 정책 설정
- [ ] 도메인 연결 + Cloudflare DNS
- [ ] `NEXT_PUBLIC_SITE_URL` 실제 도메인으로 업데이트
- [ ] smoke test: 로그인, 자료 다운로드, 관리자 접근, 봇 태스크

---

## 17. 테스트 체크리스트

### RLS 권한 검증

```sql
-- supabase/tests/rls_test.sql
-- Supabase SQL Editor에서 각 케이스 실행하여 결과 확인

-- [1] 익명 사용자는 premium lesson video_url을 볼 수 없어야 함
SET request.jwt.claims TO '{}';
SELECT id, title, video_url FROM lessons WHERE tier = 'premium';
-- 기대: 0 rows (RLS 차단)

-- [2] 사용자는 다른 user_id로 게시글을 INSERT할 수 없어야 함
SET request.jwt.claims TO '{"sub": "user-a-uuid", "role": "authenticated"}';
INSERT INTO posts (user_id, board, title, content)
VALUES ('other-user-uuid', 'qa', '테스트', '내용');
-- 기대: RLS violation 에러

-- [3] 관리자는 모든 posts를 볼 수 있어야 함
-- (admin_users에 해당 user_id가 있을 때)
```

### API 엔드포인트 검증

```bash
# 비회원 + 프리미엄 자료 → 401
curl -w "%{http_code}" https://ddkker.com/api/resources/download/1

# 무료 회원 + 프리미엄 자료 → 403
curl -H "Cookie: sb-token=..." -w "%{http_code}" \
  https://ddkker.com/api/resources/download/1

# Rate limit 확인 (11번째 요청 → 429)
for i in {1..11}; do
  curl -w "%{http_code}\n" https://ddkker.com/api/resources/download/1
done
```

### UI 체크 (모바일/데스크톱)

- [ ] 375px: 햄버거 메뉴, 히어로 단일 컬럼, 카드 1열
- [ ] 768px: 카드 2열, 가격 2열
- [ ] 1440px: 카드 3열, 가격 2~3열
- [ ] 긴 한글 제목이 레이아웃을 깨지 않는다
- [ ] 로그인 전/후 TopNav 상태가 올바르다
- [ ] 개인정보처리방침·이용약관 링크가 Footer에서 동작한다

---

## 18. 권장 커밋 단위

```
chore: initialize Next.js 14 frontend with src/ structure
feat: add supabase schema, RLS policies, and functions
feat: add tailwind design tokens and common UI components
feat: add google oauth callback and profile trigger
feat: add public pages (home, courses, membership, resources, faq, youtube)
feat: add admin CMS for courses, resources, faqs, members
feat: add r2 download gate with rate limiting and membership check
feat: add community posts and comments with RLS
feat: add bot worker and oracle cloud systemd setup
feat: add bot thumbnail generation and admin task panel
chore: configure vercel deployment and production env
docs: add privacy policy and terms pages
```

---

## 19. 구현자 최종 체크리스트

- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 `NEXT_PUBLIC_` 접두사 없이 server-only 모듈에서만 사용됨
- [ ] `file_key`가 어떤 public API 응답에도 포함되지 않음
- [ ] 모든 INSERT는 서버 세션의 user_id를 기준으로 함 (클라이언트 입력 무시)
- [ ] RLS 정책에 `USING`과 `WITH CHECK`가 모두 필요한 곳에 있음
- [ ] 관리자 권한은 UI 표시가 아닌 서버 `requireAdmin()`에서 차단함
- [ ] `claim_bot_task()` RPC로 atomic claim 처리 (단순 UPDATE 금지)
- [ ] stuck claimed 태스크를 복구하는 `recover_stuck_bot_tasks()` 주기적 실행
- [ ] Kakao 로그인은 Google MVP 안정화 후 별도 브랜치에서 진행
- [ ] 결제는 수동 멤버십으로 먼저 검증 후 웹훅 기반으로 붙임
- [ ] 개인정보처리방침·이용약관 페이지가 Footer에서 접근 가능함
- [ ] Oracle VM `.env` 파일 권한 `chmod 600`으로 설정됨
- [ ] `next/image` remotePatterns에 R2·YouTube·Supabase 도메인이 등록됨
- [ ] 각 페이지에 적절한 ISR `revalidate` 값이 설정됨
- [ ] 봇 썸네일 생성이 관리자 화면에서 버튼 클릭으로 동작함 (핵심 데모)

---

*딸깍러 plan_claude.md — 2026년 5월 기준*  
*기반: plan.md + plan_codex.md + Claude 검토 의견 통합*
