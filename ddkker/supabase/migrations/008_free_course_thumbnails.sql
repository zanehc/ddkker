-- 008_free_course_thumbnails.sql
-- 무료 강의 카드/상세에 사용할 로컬 썸네일 자산 경로를 채운다.

UPDATE courses
SET
  thumbnail_url = CASE slug
    WHEN 'vibe-coding-setup' THEN '/images/courses/vibe-coding-setup.jpg'
    WHEN 'claude-cli-noninteractive' THEN '/images/courses/claude-cli-noninteractive.jpg'
    WHEN 'vercel-supabase-basics' THEN '/images/courses/vercel-supabase-basics.jpg'
    WHEN 'google-oauth-profile' THEN '/images/courses/google-oauth-profile.jpg'
    ELSE thumbnail_url
  END,
  updated_at = NOW()
WHERE tier = 'free'
  AND slug IN (
    'vibe-coding-setup',
    'claude-cli-noninteractive',
    'vercel-supabase-basics',
    'google-oauth-profile'
  );
