-- 009_project_inquiries.sql
-- 외주 의뢰 접수 채널.
--   - project_inquiries : 크몽·재능넷·위시캣·숨고 등에서 유입된 외주 문의를 접수·관리.
--   - 접수는 로그인 필수(auth.uid() = user_id). 유입경로(source) 태깅으로 플랫폼별 성과 추적.
--   - 상태 파이프라인(new→contacted→quoted→contracted→done/dropped)은 관리자만 변경(service role).
-- 컨벤션은 007/008을 미러링: BIGSERIAL PK, TEXT+CHECK 상태값, created/updated_at 수동 관리,
-- DROP POLICY IF EXISTS 후 CREATE POLICY.

-- 1) project_inquiries -------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_inquiries (
  id            BIGSERIAL PRIMARY KEY,
  -- 접수는 로그인 필수지만, 탈퇴 후에도 의뢰는 보존해야 하므로 SET NULL.
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  contact_name  TEXT NOT NULL CHECK (char_length(contact_name) BETWEEN 1 AND 50),
  contact_email TEXT NOT NULL CHECK (char_length(contact_email) BETWEEN 3 AND 200),
  contact_phone TEXT,                                          -- 선택
  project_type  TEXT NOT NULL
                CHECK (project_type IN ('web','app','automation','ai','data','design','etc')),
  budget_range  TEXT
                CHECK (budget_range IN ('under_100','100_300','300_500','500_1000','over_1000','undecided')),
  timeline      TEXT,                                          -- 자유 입력(예: "2주", "협의")
  title         TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
  description   TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 5000),
  source        TEXT NOT NULL DEFAULT 'direct'
                CHECK (source IN ('kmong','talentnet','wishket','soomgo','direct','other')),
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','contacted','quoted','contracted','done','dropped')),
  admin_note    TEXT,
  -- 개인정보 처리 고지 확인 이력
  privacy_ack_at         TIMESTAMPTZ,
  privacy_notice_version TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS project_inquiries_status_idx ON project_inquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS project_inquiries_source_idx ON project_inquiries(source);
CREATE INDEX IF NOT EXISTS project_inquiries_user_idx   ON project_inquiries(user_id);

-- 2) RLS ---------------------------------------------------------------------
-- 접수자는 본인 의뢰 SELECT/INSERT, 관리자는 전체. 상태/메모 변경은 service role(정책 없음 → 차단).
ALTER TABLE project_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inq_select_own" ON project_inquiries;
CREATE POLICY "inq_select_own" ON project_inquiries
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "inq_insert_own" ON project_inquiries;
CREATE POLICY "inq_insert_own" ON project_inquiries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "inq_all_admin" ON project_inquiries;
CREATE POLICY "inq_all_admin" ON project_inquiries
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

GRANT SELECT, INSERT ON project_inquiries TO authenticated;
GRANT SELECT ON project_inquiries TO anon;
GRANT USAGE, SELECT ON SEQUENCE project_inquiries_id_seq TO authenticated;
