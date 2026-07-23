-- supabase/tests/rls_test.sql
-- Supabase SQL Editor에서 각 케이스 실행하여 결과 확인

-- [1] 익명 사용자는 premium lesson video_url을 볼 수 없어야 함
SET request.jwt.claims TO '{}';
SELECT id, title, video_url FROM lessons WHERE tier = 'premium';
-- 기대: 0 rows (RLS 차단)

-- [2] 사용자는 다른 user_id로 게시글을 INSERT할 수 없어야 함
SET request.jwt.claims TO '{"sub": "user-a-uuid", "role": "authenticated"}';
INSERT INTO posts (user_id, board, title, content)
VALUES ('other-user-uuid', 'qa', '테스트', '내용');
-- 기대: RLS violation 에러

-- [3] 관리자는 모든 posts를 볼 수 있어야 함
-- (admin_users에 해당 user_id가 있을 때)
