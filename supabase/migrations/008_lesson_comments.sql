-- 008_lesson_comments.sql
-- 수업(lesson)별 댓글/대댓글 + 3개 프리미엄 강의 커리큘럼 초안 시드.
--   - lesson_comments : parent_id로 대댓글(1단계) 표현. 읽기 공개, 쓰기=구매자/관리자.
--   - can_comment_lesson() : 해당 수업에 댓글 작성 권한(무료강의·구매자·관리자) 판정.
--   - 커리큘럼 시드 : video_url=NULL(비활성, "준비중"), 관리자가 영상 연결 시 활성화.
-- 모두 idempotent (IF NOT EXISTS / NOT EXISTS 가드) — 여러 번 실행해도 안전.

-- 1) lesson_comments --------------------------------------------------------
CREATE TABLE IF NOT EXISTS lesson_comments (
  id         BIGSERIAL PRIMARY KEY,
  lesson_id  INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  parent_id  BIGINT REFERENCES lesson_comments(id) ON DELETE CASCADE, -- NULL=댓글, 값=대댓글
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_hidden  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS lesson_comments_lesson_idx ON lesson_comments(lesson_id);
CREATE INDEX IF NOT EXISTS lesson_comments_parent_idx ON lesson_comments(parent_id);

-- 2) 댓글 작성 권한 판정 함수 ------------------------------------------------
-- 관리자 / 무료강의(로그인) / 해당 강의 구매자(또는 멤버십) 만 작성 가능.
CREATE OR REPLACE FUNCTION can_comment_lesson(p_lesson_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1
    FROM lessons l
    JOIN courses c ON c.id = l.course_id
    WHERE l.id = p_lesson_id
      AND (
        is_admin()
        OR c.tier = 'free'
        OR is_enrolled(c.id)
        OR has_active_membership()
      )
  );
$$;

-- 3) RLS --------------------------------------------------------------------
ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;

-- 읽기: 공개(숨김 제외). 관리자·본인은 숨김 글도 조회.
DROP POLICY IF EXISTS "lesson_comments_select" ON lesson_comments;
CREATE POLICY "lesson_comments_select" ON lesson_comments
  FOR SELECT USING (is_hidden = false OR is_admin() OR auth.uid() = user_id);

-- 쓰기: 본인 명의 + 해당 강의 댓글 권한 보유.
DROP POLICY IF EXISTS "lesson_comments_insert" ON lesson_comments;
CREATE POLICY "lesson_comments_insert" ON lesson_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND can_comment_lesson(lesson_id));

-- 수정: 본인 글만 (user_id 변경 방지 위해 WITH CHECK 동반).
DROP POLICY IF EXISTS "lesson_comments_update_own" ON lesson_comments;
CREATE POLICY "lesson_comments_update_own" ON lesson_comments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 삭제: 본인 글만.
DROP POLICY IF EXISTS "lesson_comments_delete_own" ON lesson_comments;
CREATE POLICY "lesson_comments_delete_own" ON lesson_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 관리자: 전체 (숨김/삭제 모더레이션).
DROP POLICY IF EXISTS "lesson_comments_admin" ON lesson_comments;
CREATE POLICY "lesson_comments_admin" ON lesson_comments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Data API 노출(역할 권한). RLS가 행 접근을 통제하고, 아래는 테이블 접근 권한.
GRANT SELECT, INSERT, UPDATE, DELETE ON lesson_comments TO authenticated;
GRANT SELECT ON lesson_comments TO anon;
GRANT USAGE, SELECT ON SEQUENCE lesson_comments_id_seq TO authenticated;

-- 4) 커리큘럼 초안 시드 (3개 프리미엄 강의) ---------------------------------
-- 각 강의에 수업이 하나도 없을 때만 삽입(NOT EXISTS) → 멱등 + 관리자 편집 보존.
-- video_url=NULL → 비활성("준비중"), 영상 연결 시 활성화.

-- 4-1) 바이브코딩 실무응용
INSERT INTO lessons (course_id, title, sort_order, duration_min, tier, published, video_url)
SELECT c.id, v.title, v.ord, v.dur, 'premium', true, NULL
FROM courses c
CROSS JOIN (VALUES
  ('오리엔테이션 · 개발환경 점검', 1, 8),
  ('아이디어를 요구사항으로 정리하기', 2, 14),
  ('요구사항 → 설계로 옮기기', 3, 16),
  ('핵심 기능 구현 실습 ①', 4, 22),
  ('핵심 기능 구현 실습 ②', 5, 22),
  ('실제 배포까지 (Vercel)', 6, 18),
  ('회고 · 개선 + 소스코드 정리', 7, 12)
) AS v(title, ord, dur)
WHERE c.slug = 'vibe-coding-advanced'
  AND NOT EXISTS (SELECT 1 FROM lessons l WHERE l.course_id = c.id);

-- 4-2) 로컬AI 토큰절약 전략
INSERT INTO lessons (course_id, title, sort_order, duration_min, tier, published, video_url)
SELECT c.id, v.title, v.ord, v.dur, 'premium', true, NULL
FROM courses c
CROSS JOIN (VALUES
  ('오리엔테이션 : 토큰 비용 구조 이해', 1, 10),
  ('멀티 CLI 에이전트 개요 — Claude · Codex · Antigravity', 2, 14),
  ('로컬AI 스택 구축 — Mac Mini · MLX · Hermes', 3, 22),
  ('하이브리드 라우팅 : 초안은 로컬, 정밀은 프리미엄', 4, 18),
  ('프롬프트 캐싱 · 컨텍스트 압축 실전', 5, 16),
  ('서브에이전트로 토큰 사용량 최적화', 6, 16),
  ('토큰 · 비용 대시보드로 절감 검증', 7, 14),
  ('마무리 : 운영 체크리스트 + 템플릿', 8, 10)
) AS v(title, ord, dur)
WHERE c.slug = 'local-ai-token-strategy'
  AND NOT EXISTS (SELECT 1 FROM lessons l WHERE l.course_id = c.id);

-- 4-3) CLI 기반 응용프로그램 오케스트레이션
INSERT INTO lessons (course_id, title, sort_order, duration_min, tier, published, video_url)
SELECT c.id, v.title, v.ord, v.dur, 'premium', true, NULL
FROM courses c
CROSS JOIN (VALUES
  ('오리엔테이션 : 오케스트레이션이란', 1, 10),
  ('CLI 에이전트 기본기 다지기', 2, 14),
  ('멀티 에이전트 워크플로 설계 패턴', 3, 18),
  ('병렬 실행과 작업 분배', 4, 18),
  ('결과 통합 · 검증 파이프라인', 5, 16),
  ('실전 자동화 시나리오 구축', 6, 20),
  ('마무리 · 소스코드 + 확장 아이디어', 7, 12)
) AS v(title, ord, dur)
WHERE c.slug = 'cli-app-orchestration'
  AND NOT EXISTS (SELECT 1 FROM lessons l WHERE l.course_id = c.id);
