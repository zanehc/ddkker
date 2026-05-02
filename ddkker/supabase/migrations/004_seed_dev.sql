-- 개발·데모용 시드 데이터 (production에서는 실행 금지)
INSERT INTO courses (title, slug, description, category, difficulty, tier, published, sort_order) VALUES
  ('바이브코딩 환경 세팅', 'vibe-coding-setup', 'VS Code + Claude Code + nvm을 5분 만에 구축한다', 'vibe-coding', 'beginner', 'free', true, 1),
  ('Claude CLI 비대화식 실행', 'claude-cli-noninteractive', 'API 키 없이 구독으로 Claude를 자동화 파이프라인에 투입한다', 'claude-cli', 'intermediate', 'free', true, 2),
  ('24시간 자동화봇 구조', 'autobot-architecture', 'daemon_service + relay + worker 3-tier 구조를 이해한다', 'autobot', 'intermediate', 'premium', true, 3),
  ('Vercel + Supabase 기초', 'vercel-supabase-basics', '$0 SaaS 인프라를 30분 만에 세팅한다', 'saas-infra', 'beginner', 'free', true, 4),
  ('Google OAuth + 프로필 자동 생성', 'google-oauth-profile', 'Supabase Auth + trigger로 5분 만에 로그인 시스템을 만든다', 'google-auth', 'beginner', 'free', true, 5),
  ('Cloudflare R2 파일 관리', 'cloudflare-r2-files', 'egress 무료 R2에 파일을 올리고 presigned URL로 안전하게 제공한다', 'saas-infra', 'intermediate', 'premium', true, 6);

INSERT INTO faqs (question, answer, category, sort_order) VALUES
  ('무료 강의는 어디서 볼 수 있나요?', '상단 메뉴의 [무료강의]에서 바로 수강할 수 있습니다.', 'enrollment', 1),
  ('멤버십 결제는 어떻게 하나요?', '현재 베타 기간 중으로 관리자가 수동으로 멤버십을 부여합니다. 커뮤니티 Q&A에 문의해주세요.', 'membership', 2),
  ('강의 자료는 어디서 받나요?', '[자료실] 메뉴에서 강의별 소스코드와 템플릿을 다운로드할 수 있습니다. 프리미엄 자료는 멤버십이 필요합니다.', 'content', 3),
  ('Claude Code 없이 수강할 수 있나요?', '네. 강의는 개념 이해 위주로 구성되어 있습니다. Claude Pro/Max 구독이 있으면 실습까지 가능합니다.', 'content', 4),
  ('Oracle Cloud 계정이 꼭 필요한가요?', '봇 운영 실습을 위해서는 필요합니다. Oracle Cloud Always Free 계정(신용카드 필요)으로 무료로 이용할 수 있습니다.', 'technical', 5);
