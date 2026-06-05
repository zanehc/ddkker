-- ─────────────────────────────────────────────
-- admin_users 보안 강화 + 관리자 시드
-- ─────────────────────────────────────────────
-- 권한 모델 (관리자 / 일반유저 분리):
--   * 일반유저  = 로그인만 한 사용자. RLS로 본인 데이터·공개 데이터만 접근.
--   * 관리자    = admin_users 에 user_id 가 존재하는 사용자.
--   * is_admin() (002_rls.sql) 이 admin_users 를 참조하며, courses/lessons/
--     resources/posts/comments/faqs 등 모든 테이블의 "_admin" RLS 정책 기준이 된다.
--   * 앱단 가드: requireAdmin() (frontend/src/lib/server/authz.ts) 가 service role 로 검증.

-- RLS 명시적 활성화.
--   실DB에는 이미 켜져 있으나(빈 정책으로 anon INSERT가 42501로 차단됨을 확인),
--   002_rls.sql 에 활성화 구문이 누락되어 있어 신규 배포 시 무방비가 될 수 있다. 드리프트 교정.
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- anon / authenticated 용 정책은 의도적으로 두지 않는다.
--   - SELECT      : 정책 없음 → 일반 사용자에게는 항상 0행 (관리자 명단 열람·열거 불가)
--   - INSERT/UPDATE/DELETE : 정책 없음 → 전면 차단 (스스로 관리자 등록 = 권한 상승 방지)
-- 정당한 접근 경로:
--   - service role (requireAdmin, 관리자 부여 스크립트) — RLS 우회
--   - is_admin() — SECURITY DEFINER 로 caller 본인의 관리자 여부만 boolean 반환

-- 관리자 시드: chkomi95@gmail.com 을 관리자로 지정.
-- (이미 가입된 사용자. 미가입 상태면 가입 후 본 구문 재실행 필요.)
-- ON CONFLICT 로 멱등 — 여러 번 실행해도 안전.
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'chkomi95@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
