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
