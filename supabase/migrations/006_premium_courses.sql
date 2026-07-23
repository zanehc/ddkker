-- 006_premium_courses.sql
-- 프리미엄(강의별 개별 구매) 강의를 DB로 옮겨 관리자가 편집 가능하게 한다.
--   - courses.price       : 강의 가격(원, 0 = 무료)
--   - courses.highlights  : 프리미엄 카드에 노출할 커리큘럼 불릿(JSONB 문자열 배열)
--   - category 신규 값 추가: local-ai, cli-orchestration
-- 프리미엄 강의 3종을 idempotent 하게 시드한다.

-- 1) 컬럼 추가 ----------------------------------------------------------------
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price INTEGER NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS highlights JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2) 카테고리 CHECK 제약 확장 ------------------------------------------------
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_category_check;
ALTER TABLE courses ADD CONSTRAINT courses_category_check CHECK (category IN (
  'vibe-coding','autobot','saas-infra','google-auth','claude-cli','codex-cli',
  'local-ai','cli-orchestration'
));

-- 3) 프리미엄 강의 시드 (slug 기준 upsert) -----------------------------------
INSERT INTO courses (title, slug, description, category, difficulty, tier, price, highlights, sort_order, published)
VALUES
  (
    'Claude · Codex · Antigravity + 로컬AI 활용 토큰절약 전략',
    'local-ai-token-strategy',
    '유료 AI 토큰을 태우지 않고 로컬AI와 CLI 에이전트를 조합해 비용을 1/10로 줄이는 실전 운영 전략 전 과정.',
    'local-ai',
    'advanced',
    'premium',
    500000,
    '[
      "Claude Code · Codex · Antigravity 멀티 CLI 에이전트 오케스트레이션",
      "Mac Mini / 로컬 GPU에 Hermes·MLX 로컬AI 스택 구축",
      "초안은 로컬AI, 정밀 작업만 프리미엄 모델로 — 하이브리드 라우팅",
      "프롬프트 캐싱·컨텍스트 압축·서브에이전트로 토큰 사용량 최적화",
      "실측 토큰/비용 대시보드로 절감 효과 검증",
      "전체 소스코드 · 설정 템플릿 · 영구 수강 포함"
    ]'::jsonb,
    1,
    true
  ),
  (
    '바이브코딩 실무응용',
    'vibe-coding-advanced',
    '기초를 넘어 실제 SaaS를 출시하는 수준까지, 바이브코딩으로 제품을 완성하는 응용 과정.',
    'vibe-coding',
    'advanced',
    'premium',
    150000,
    '[
      "요구사항 → 설계 → 구현 전체 파이프라인",
      "실제 배포까지 이어지는 프로젝트 실습",
      "소스코드 · 영구 수강 포함"
    ]'::jsonb,
    2,
    true
  ),
  (
    'CLI 기반 응용프로그램 오케스트레이션',
    'cli-app-orchestration',
    '여러 CLI 에이전트와 도구를 조합해 복잡한 작업을 자동화·병렬화하는 오케스트레이션 설계.',
    'cli-orchestration',
    'advanced',
    'premium',
    300000,
    '[
      "멀티 에이전트 워크플로 설계 패턴",
      "병렬 실행 · 작업 분배 · 결과 통합",
      "소스코드 · 영구 수강 포함"
    ]'::jsonb,
    3,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  title       = EXCLUDED.title,
  description  = EXCLUDED.description,
  category     = EXCLUDED.category,
  difficulty   = EXCLUDED.difficulty,
  tier         = EXCLUDED.tier,
  price        = EXCLUDED.price,
  highlights   = EXCLUDED.highlights,
  sort_order   = EXCLUDED.sort_order,
  published    = EXCLUDED.published,
  updated_at   = NOW();
