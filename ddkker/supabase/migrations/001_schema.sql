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
