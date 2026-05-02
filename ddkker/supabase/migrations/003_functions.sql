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
