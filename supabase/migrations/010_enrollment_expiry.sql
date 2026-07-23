-- 010_enrollment_expiry.sql
-- 수강권을 "1회 구매 = 영구"에서 "구매일로부터 N개월(기본 12개월)"로 전환한다.
--   - courses.access_months  : 강의별 수강 가능 개월 수. NULL = 무기한.
--   - enrollments.expires_at : 수강권 만료 시각. NULL = 무기한.
--   - is_enrolled()          : 만료 검사 추가 → lessons/comments RLS에 자동 반영.
--
-- 기존 수강권은 expires_at = NULL 로 남긴다. 이미 "영구 수강" 조건으로 판매된 건이라
-- 소급 적용은 약관 변경 고지·동의가 선행되어야 하므로 (6)에 보류해 둔다.

-- 1) courses.access_months ---------------------------------------------------
ALTER TABLE courses ADD COLUMN IF NOT EXISTS access_months INTEGER DEFAULT 12;
COMMENT ON COLUMN courses.access_months IS '구매 후 수강 가능 개월 수. NULL이면 무기한.';

ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_access_months_check;
ALTER TABLE courses ADD CONSTRAINT courses_access_months_check
  CHECK (access_months IS NULL OR access_months > 0);

-- 이미 존재하던 강의 행(DEFAULT 적용 전 생성분)도 12개월로 맞춘다.
UPDATE courses SET access_months = 12 WHERE access_months IS NULL;

-- 2) enrollments.expires_at --------------------------------------------------
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
COMMENT ON COLUMN enrollments.expires_at IS '수강권 만료 시각. NULL이면 무기한(기존 영구 수강권).';
CREATE INDEX IF NOT EXISTS enrollments_expires_idx ON enrollments(expires_at);

-- 3) INSERT 시 만료일 자동 계산 (앱이 값을 넣지 않은 경로의 안전망) -----------
--    갱신(재구매)은 UPDATE 경로라 트리거가 걸리지 않는다. 의도적으로 앱이
--    expires_at 을 명시하게 두어, 웹훅 재전송이 만료일을 연장하지 못하게 한다.
CREATE OR REPLACE FUNCTION set_enrollment_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_months INTEGER;
BEGIN
  -- 앱이 이미 계산해 넣었으면 그대로 존중
  IF NEW.expires_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- 관리자 수동 부여(source='manual')는 명시하지 않는 한 무기한 유지
  IF NEW.source <> 'payment' THEN
    RETURN NEW;
  END IF;

  SELECT access_months INTO v_months FROM courses WHERE id = NEW.course_id;
  IF v_months IS NOT NULL THEN
    NEW.expires_at := COALESCE(NEW.granted_at, NOW()) + make_interval(months => v_months);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollments_set_expiry ON enrollments;
CREATE TRIGGER enrollments_set_expiry
  BEFORE INSERT ON enrollments
  FOR EACH ROW EXECUTE FUNCTION set_enrollment_expiry();

-- 4) is_enrolled(): 만료 검사 추가 -------------------------------------------
--    lessons_select(007) / lesson_comments(008) 정책이 이 함수를 쓰므로
--    정책을 다시 만들지 않아도 만료가 그대로 반영된다.
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
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- 5) 판매 문구 정정: 시드된 highlights의 "영구 수강" → "12개월 수강" ----------
UPDATE courses
SET highlights = REPLACE(highlights::text, '영구 수강', '12개월 수강')::jsonb,
    updated_at = NOW()
WHERE highlights::text LIKE '%영구 수강%';

-- 6) [보류] 기존 구매자 소급 적용 ---------------------------------------------
-- 기본값은 "소급 없음"이다. 기존 구매자는 expires_at = NULL 로 영구 수강이 유지된다.
-- 소급 적용하려면 약관 변경 고지 후 아래를 실행할 것.
--
--   UPDATE enrollments e
--   SET    expires_at = e.granted_at + make_interval(months => c.access_months)
--   FROM   courses c
--   WHERE  c.id = e.course_id
--     AND  e.expires_at IS NULL
--     AND  c.access_months IS NOT NULL;
--
-- 시행일 기준으로 12개월을 새로 주려면 e.granted_at 대신 NOW() 를 쓴다.
