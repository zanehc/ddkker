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
-- faqs, audit_logs
-- ─────────────────────────────────────────────
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs_select_published" ON faqs FOR SELECT USING (published = true);
CREATE POLICY "faqs_admin" ON faqs FOR ALL USING (is_admin());

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- service role 전용
