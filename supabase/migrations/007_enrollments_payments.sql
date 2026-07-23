-- 007_enrollments_payments.sql
-- 강의별 개별 구매(소유형) + 포트원 결제 도입.
--   - enrollments : 권한의 새 source of truth. 1회 구매 = 영구 수강.
--   - payments    : 포트원 거래 기록. payment_id(PK)로 멱등성 보장.
--   - is_enrolled(): 수강권 확인 함수. lessons/resources 게이팅에 사용.
-- memberships 테이블/has_active_membership()는 호환을 위해 보존(비파괴).

-- 1) enrollments ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'active'  CHECK (status IN ('active','refunded')),
  source     TEXT NOT NULL DEFAULT 'payment' CHECK (source IN ('payment','manual')),
  payment_id TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note       TEXT,
  UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS enrollments_user_idx   ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS enrollments_course_idx ON enrollments(course_id);

-- 2) payments ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  payment_id TEXT PRIMARY KEY,                 -- 포트원 paymentId (클라 생성, 멱등 키)
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,                 -- 검증된 결제 금액(원)
  status     TEXT NOT NULL CHECK (status IN ('paid','failed','cancelled','refunded')),
  raw        JSONB,                            -- 포트원 결제 조회 응답 원본
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payments_user_idx   ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_course_idx ON payments(course_id);

-- enrollments.payment_id → payments(payment_id) (결제 출처 추적, 환불 시 정리)
DO $$ BEGIN
  ALTER TABLE enrollments
    ADD CONSTRAINT enrollments_payment_fk
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) is_enrolled() ----------------------------------------------------------
CREATE OR REPLACE FUNCTION is_enrolled(p_course_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments
    WHERE user_id = auth.uid()
      AND course_id = p_course_id
      AND status = 'active'
  );
$$;

-- 4) RLS --------------------------------------------------------------------
-- enrollments: 본인+admin SELECT, 쓰기는 service role 전용(정책 없음 → 차단)
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enrollments_select_own" ON enrollments;
CREATE POLICY "enrollments_select_own" ON enrollments
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- payments: 본인+admin SELECT, 쓰기는 service role 전용
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- 5) lessons 게이팅에 enrollment 반영 (멤버십은 호환 위해 유지) -------------
DROP POLICY IF EXISTS "lessons_select" ON lessons;
CREATE POLICY "lessons_select" ON lessons
  FOR SELECT USING (
    published = true AND (
      tier = 'free'
      OR has_active_membership()
      OR is_enrolled(course_id)
      OR is_admin()
    )
  );

-- 6) resources를 강의에 연결(프리미엄 자료 = 연결 강의 구매자 다운로드) ------
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS resources_course_idx ON resources(course_id);
