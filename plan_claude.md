# 딸깍러 SaaS 강의사이트 — 구축 계획

> 기준 문서: `plan.md`, `plan_codex.md`, `DESIGN.md`, `강의핵심지식.md`  
> 핵심 수정: `강의핵심지식.md`에 있는 Claude/Codex/자동화봇 내용은 **강의 콘텐츠 주제**이며, 현재 구축하는 강의사이트의 **운영 기능**이 아니다.

---

## 0. 가장 중요한 구분

이 문서는 앞으로 아래 두 영역을 절대 섞지 않는다.

| 영역 | 의미 | 현재 사이트에 구현하는가? |
|---|---|---|
| 강의사이트 구축 | 수강생이 강의, 자료, 멤버십, 커뮤니티를 이용하는 웹 서비스 | 예 |
| 강의핵심지식 | Claude Code, Codex CLI, 자동화봇, Oracle Cloud, R2 등 강의에서 설명할 지식 | 콘텐츠로만 반영 |
| 사이트 운영 봇 | 사이트가 자체적으로 Claude/Codex 봇을 돌려 썸네일, Q&A, 운영 작업을 처리하는 기능 | 아니오 |

따라서 `Claude`, `Codex`, `자동화봇`, `Oracle Cloud`, `ddkkbot`이라는 단어가 등장하더라도 기본 해석은 **강의 주제, 카테고리, 강의 설명, 자료 제목**이다. 별도 지시가 있기 전까지 이를 사이트 런타임 기능, 관리자 기능, DB 큐, 배포 대상 worker로 해석하지 않는다.

---

## 1. 제품 목표

- 무료 강의와 핵심 자료로 신뢰를 만든다.
- 멤버십 전환이 가능한 강의 플랫폼 구조를 갖춘다.
- 수강생이 `강의핵심지식.md`의 내용을 순서대로 탐색할 수 있게 만든다.
- 사이트 자체는 안정적인 콘텐츠/CMS/멤버십 서비스로 구현한다.

### 하지 않는 것

- 사이트 운영용 Claude/Codex 봇을 가동하지 않는다.
- `bot_tasks` 큐, worker, Oracle VM, systemd 서비스를 만들지 않는다.
- 관리자 화면에 봇 태스크 생성/재시도/로그 패널을 만들지 않는다.
- Q&A 댓글을 AI가 자동 작성하거나 썸네일을 자동 생성하지 않는다.
- `SUPABASE_SERVICE_ROLE_KEY`를 봇 또는 외부 worker와 공유하지 않는다.

---

## 2. 구현 원칙

- **콘텐츠와 기능을 분리한다**  
  `autobot`, `claude-cli`, `codex-cli`는 강의 카테고리다. 사이트 운영 모듈 이름이나 background job 이름이 아니다.

- **MVP는 강의 플랫폼에 집중한다**  
  공개 강의, 강의 상세, 자료실, 로그인, 관리자 CMS, 수동 멤버십, 커뮤니티, FAQ, 법률 페이지까지를 1차 목표로 한다.

- **운영 자동화는 2차 기능도 아니다**  
  자동화봇은 강의 내용이다. 사이트에 실제 운영 봇을 붙이는 것은 별도 제품 결정이 있을 때만 새 플랜으로 다룬다.

- **권한은 DB와 서버에서 검증한다**  
  UI의 lock 표시는 보조 수단이다. 실제 차단은 RLS, Route Handler, presigned URL에서 처리한다.

- **서비스 롤 키는 서버 전용이다**  
  `SUPABASE_SERVICE_ROLE_KEY`는 Next.js 서버 전용 모듈에서만 사용한다.

- **콘텐츠 목록과 파일 다운로드 권한을 분리한다**  
  카드 메타데이터는 공개 가능하지만, `file_key`와 presigned URL은 서버에서만 다룬다.

- **디자인은 `DESIGN.md`를 기준으로 삼는다**  
  다만 "봇이 사이트를 운영한다"는 문구는 사용하지 않는다. 디자인 카피는 "자동화봇을 배우는 강의"로 정정한다.

---

## 3. MVP 범위

### 포함

- Next.js 14 App Router 앱 (`frontend/src` 기준)
- Supabase Auth Google 로그인
- 프로필 자동 생성 DB trigger
- 공개 페이지: 홈, 강의 목록, 강의 상세, 멤버십, 자료실, 커뮤니티, FAQ, YouTube, 개인정보처리방침, 이용약관
- 관리자 CMS: 강의, 수업, 자료, FAQ, 멤버십 수동 관리
- R2 private bucket 자료 다운로드 게이트
- 커뮤니티 글/댓글
- 관리자 감사 로그
- Vercel 배포

### 2차로 미룸

- Kakao 로그인
- 자동 결제 정기구독
- YouTube Data API 자동 동기화
- 영상 진도율, 수료증
- 고급 검색, 추천
- 강의별 퀴즈/과제

### 명시적으로 제외

- `bot/` worker
- `bot_tasks` 테이블
- `claim_bot_task()` / `recover_stuck_bot_tasks()` RPC
- Oracle Cloud worker 배포
- Claude CLI/Codex CLI를 사이트 서버에서 호출하는 기능
- AI 답변 초안, 자동 썸네일 생성, 자동 알림 발송

---

## 4. 1차 릴리즈 완료 기준

- 운영 URL에서 회원가입/로그인/로그아웃이 동작한다.
- 관리자가 강의, 수업, 자료, FAQ를 등록하고 공개 페이지에서 확인할 수 있다.
- 강의 카테고리에 `바이브코딩`, `자동화봇`, `SaaS 인프라`, `Google 로그인`, `Claude CLI`, `Codex CLI`가 표시된다.
- 위 카테고리는 콘텐츠 분류일 뿐 사이트 운영 기능으로 연결되지 않는다.
- 비회원은 무료 강의와 무료 자료만 접근 가능하다.
- 멤버십 사용자는 프리미엄 강의/자료에 접근 가능하다.
- 프리미엄 자료 다운로드는 서버 검증 후 presigned URL로만 제공된다.
- 커뮤니티 글/댓글에서 `user_id` 위조가 RLS로 차단된다.
- 관리자 권한은 서버 `requireAdmin()`에서 차단된다.
- `npm run lint`, `npm run type-check`, `npm run build`가 통과한다.
- 개인정보처리방침과 이용약관 페이지가 Footer에서 접근 가능하다.

---

## 5. 기술 결정사항

| 항목 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 14 App Router | Vercel 배포와 서버 컴포넌트 활용 |
| 경로 구조 | `frontend/src/app` | create-next-app `--src-dir` 기준 |
| 스타일 | Tailwind CSS + 로컬 컴포넌트 | `DESIGN.md` 토큰을 직접 반영 |
| 폰트 | Noto Serif KR + Pretendard + JetBrains Mono | 브랜드 디자인 기준 |
| DB/Auth | Supabase PostgreSQL + Auth | RLS, Auth, SQL function 구성에 적합 |
| 파일 | Cloudflare R2 private bucket | 자료 파일을 비공개로 보관하고 presigned URL 제공 |
| 영상 | YouTube Unlisted 임베드 | 빠른 출시. 필요 시 Vimeo 등으로 교체 가능 |
| 결제 | MVP: 수동 부여 / 2차: 토스페이먼츠 또는 Stripe | 초기 운영 리스크 축소 |
| Rate limit | Upstash Redis + `@upstash/ratelimit` | Vercel 환경에서 간단히 적용 |
| 이메일 | Resend | 멤버십 안내, 관리자 알림 확장용 |
| 배포 | Vercel | 프론트엔드 운영 대상은 Next.js 앱 하나 |

---

## 6. 프로젝트 구조

```text
/Users/yun/Documents/ddkker/
├── DESIGN.md
├── 강의핵심지식.md                 # 강의 콘텐츠 원천. 런타임 worker 스펙 아님
├── plan.md
├── plan_codex.md
├── plan_claude.md                 # 이 파일
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css
│   │   │   ├── not-found.tsx
│   │   │   ├── error.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── page.tsx
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── membership/page.tsx
│   │   │   ├── resources/page.tsx
│   │   │   ├── community/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── youtube/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── courses/page.tsx
│   │   │   │   ├── resources/page.tsx
│   │   │   │   ├── faqs/page.tsx
│   │   │   │   └── members/page.tsx
│   │   │   ├── auth/callback/route.ts
│   │   │   └── api/
│   │   │       ├── resources/download/[id]/route.ts
│   │   │       ├── posts/route.ts
│   │   │       ├── comments/route.ts
│   │   │       └── admin/
│   │   │           ├── courses/route.ts
│   │   │           ├── resources/route.ts
│   │   │           └── members/route.ts
│   │   ├── components/
│   │   │   ├── layout/TopNav.tsx
│   │   │   ├── layout/Footer.tsx
│   │   │   ├── ui/
│   │   │   ├── sections/
│   │   │   ├── community/
│   │   │   └── admin/
│   │   ├── lib/
│   │   │   ├── supabase/client.ts
│   │   │   ├── supabase/server.ts
│   │   │   ├── server/admin-client.ts
│   │   │   ├── server/authz.ts
│   │   │   ├── server/r2.ts
│   │   │   ├── ratelimit.ts
│   │   │   └── utils.ts
│   │   └── types/index.ts
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── package.json
│   └── .env.local.example
└── supabase/
    ├── migrations/
    │   ├── 001_schema.sql
    │   ├── 002_rls.sql
    │   ├── 003_functions.sql
    │   └── 004_seed_dev.sql
    └── tests/rls_test.sql
```

### 기존 구현에서 제거 또는 비활성화할 경로

현재 작업 중 이미 생성되어 있다면 아래는 사이트 MVP 범위에서 제거한다.

- `bot/`
- `frontend/src/lib/server/bot.ts`
- `frontend/src/app/admin/bot-tasks/page.tsx`
- `frontend/src/app/api/admin/bot-tasks/route.ts`
- 관리자 사이드바/대시보드의 "봇 태스크" 링크와 통계
- Supabase migration의 `bot_tasks` 테이블 및 관련 RPC
- `.env`의 `BOT_SHARED_SECRET`, `CLAUDE_CLI`, `CODEX_CLI`, `WORKER_*`, `TELEGRAM_BOT_TOKEN`

---

## 7. DB 스키마 계획

### 핵심 테이블

| 테이블 | 목적 | 비고 |
|---|---|---|
| `admin_users` | 관리자 판별 | UI가 아니라 서버 권한 체크 기준 |
| `profiles` | Auth 사용자 확장 | trigger로 자동 생성 |
| `memberships` | 수동 멤버십 권한 | MVP의 권한 source of truth |
| `courses` | 강의 묶음 | `category`는 콘텐츠 분류 |
| `lessons` | 강의 내 수업 | free/premium 구분 |
| `resources` | 자료 메타데이터 | `file_key`는 public 응답 금지 |
| `resource_downloads` | 다운로드 로그 | 남용 감지, 통계 |
| `posts` | 커뮤니티 글 | `user_id` 서버 주입 |
| `comments` | 커뮤니티 댓글 | `user_id` 서버 주입 |
| `faqs` | FAQ | 관리자 CMS에서 관리 |
| `audit_logs` | 관리자 작업 추적 | service role로 기록 |

### 만들지 않는 테이블

- `bot_tasks`
- `bot_users`
- `job_runs`
- `ai_responses`

강의에서 봇을 다루더라도 사이트 운영 DB에는 작업 큐를 만들지 않는다.

### `courses.category`

```sql
category TEXT CHECK (category IN (
  'vibe-coding',
  'autobot',
  'saas-infra',
  'google-auth',
  'claude-cli',
  'codex-cli'
))
```

주의:

- `autobot`은 "자동화봇 강의" 카테고리다.
- `claude-cli`는 "Claude CLI 사용법 강의" 카테고리다.
- `codex-cli`는 "Codex CLI 사용법 강의" 카테고리다.
- 위 값들로 worker, 큐, CLI 실행 기능을 만들지 않는다.

---

## 8. RLS 정책

### 기본 방침

- 공개 콘텐츠는 `published = true`일 때만 읽힌다.
- 프리미엄 lesson은 멤버십 또는 관리자만 읽힌다.
- 자료 메타데이터는 공개 가능하지만 다운로드 URL은 API에서만 발급한다.
- 커뮤니티 글/댓글 작성 시 `auth.uid() = user_id`를 `WITH CHECK`로 강제한다.
- 관리자 변경은 `is_admin()`과 서버 `requireAdmin()`을 함께 사용한다.

### 필수 함수

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION has_active_membership()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;
```

### 포함하지 않는 함수

- `claim_bot_task()`
- `recover_stuck_bot_tasks()`
- AI 작업 claim/retry/heartbeat 관련 함수 전체

---

## 9. 환경변수

### `frontend/.env.local.example`

```env
# Public
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Server only
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Cloudflare R2 private bucket
R2_ACCOUNT_ID=xxxx
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
R2_BUCKET_NAME=ddkker
R2_PUBLIC_BASE_URL=https://pub-xxxx.r2.dev

# Rate limiting
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxx

# Email
RESEND_API_KEY=re_xxxx
RESEND_FROM=noreply@ddkker.com

# OAuth
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx
KAKAO_CLIENT_ID=xxxx
KAKAO_CLIENT_SECRET=xxxx
```

### 금지 환경변수

아래 값은 현재 강의사이트 구축에 필요하지 않다.

```env
BOT_SHARED_SECRET=
CLAUDE_CLI=
CODEX_CLI=
WORKER_ID=
WORKER_POLL_INTERVAL_SEC=
WORKER_HEARTBEAT_INTERVAL_SEC=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ALERT_CHAT_ID=
```

---

## 10. 서버 전용 모듈

### 유지

- `src/lib/server/admin-client.ts`  
  service role client를 서버 전용으로 생성한다.

- `src/lib/server/authz.ts`  
  `requireAuth`, `requireAdmin`, `hasActiveMembership`를 제공한다.

- `src/lib/server/r2.ts`  
  private R2 object에 대한 presigned URL을 발급한다.

- `src/lib/ratelimit.ts`  
  다운로드, 글쓰기 등 abuse 가능성이 있는 API에 적용한다.

### 만들지 않음

- `src/lib/server/bot.ts`
- `enqueueBotTask()`
- AI/CLI 호출 helper
- background job enqueue helper

---

## 11. 공개 페이지 계획

### 홈

목표:

- 딸깍러가 "AI와 대화해 SaaS를 만드는 방법을 배우는 강의 플랫폼"임을 보여준다.
- 사이트가 봇으로 운영된다는 메시지는 넣지 않는다.

카피 기준:

- 가능: "Claude Code, Codex, Supabase로 실전 SaaS를 만드는 법"
- 가능: "24시간 자동화봇 구조를 강의로 배웁니다"
- 금지: "봇이 이 사이트를 운영합니다"
- 금지: "Oracle Cloud 봇이 24시간 사이트를 관리합니다"

### 강의 목록

필터:

- 전체
- 바이브코딩
- 자동화봇
- SaaS 인프라
- Google 로그인
- Claude CLI
- Codex CLI

필터는 DB category를 기준으로 콘텐츠를 나누는 UI다. 기능 플래그가 아니다.

### 강의 상세

- 강의 설명
- 수업 목록
- free/premium 표시
- 수업별 영상 임베드 또는 외부 링크
- 관련 자료 링크

프리미엄 lesson의 본문/영상 URL은 RLS 또는 서버 route에서 권한을 확인한다.

### 자료실

- 자료 카드에는 제목, 설명, 유형, 용량, 권한 표시만 노출한다.
- `file_key`는 클라이언트로 내려보내지 않는다.
- 다운로드 버튼은 `/api/resources/download/[id]`로 이동한다.

### 커뮤니티

- 게시판: Q&A, 후기, 프로젝트
- AI 자동 답변 기능은 만들지 않는다.
- 관리자가 직접 답변하거나 일반 댓글로 운영한다.

### YouTube

- MVP는 수동 등록 목록 또는 정적 배열로 시작한다.
- YouTube Data API 자동 동기화는 2차로 미룬다.

---

## 12. 관리자 CMS 계획

### 관리자 메뉴

- 대시보드
- 강의 관리
- 자료 관리
- FAQ 관리
- 멤버십 관리

### 관리자 메뉴에서 제외

- 봇 태스크
- AI 답변
- 썸네일 자동 생성
- worker 로그
- Oracle VM 상태

### 강의 관리

필드:

- 제목
- slug
- 설명
- 카테고리
- 난이도
- 썸네일 URL
- free/premium
- 공개 여부
- 정렬 순서

썸네일은 수동으로 등록한다. 이미지 생성이 필요하면 사이트 밖에서 만들고 결과 URL만 CMS에 입력한다.

### 수업 관리

필드:

- 강의 ID
- 제목
- 정렬 순서
- 영상 URL
- 수업 본문
- 예상 시간
- free/premium
- 공개 여부

### 자료 관리

필드:

- 제목
- 설명
- 카테고리
- R2 `file_key`
- 파일 타입
- 파일 크기
- free/premium
- 공개 여부

### 멤버십 관리

- 사용자 검색
- `premium` 또는 `annual` 수동 부여
- 만료일 설정
- 상태 변경: active, expired, canceled, refunded
- 관리자 메모

모든 변경은 `audit_logs`에 기록한다.

---

## 13. 콘텐츠 설계

`강의핵심지식.md`는 사이트 기능 요구사항이 아니라 강의 커리큘럼 원천이다.

### 콘텐츠로 반영할 항목

- 바이브코딩 환경 세팅
- Claude Code/Claude CLI 사용법
- Codex CLI와 이미지 생성 개념
- 24시간 자동화봇 구조
- Vercel/Supabase/R2 기반 SaaS 인프라
- Google OAuth와 프로필 자동 생성
- RLS, presigned URL, 멤버십 권한 설계

### 사이트 기능으로 반영하지 않을 항목

- 로컬 봇 또는 클라우드 봇 실행
- MultiBotManager 구조
- launchd/systemd 등록
- Claude/Codex CLI 비대화식 실행
- 자동 번역, 자동 인포그래픽 생성, 자동 업로드
- Telegram 운영 알림

### 시드 데이터 예시

```sql
INSERT INTO courses
  (title, slug, description, category, difficulty, tier, published, sort_order)
VALUES
  ('바이브코딩 환경 세팅', 'vibe-coding-setup',
   'VS Code와 Claude Code로 실습 환경을 준비한다.',
   'vibe-coding', 'beginner', 'free', true, 1),
  ('Claude CLI 비대화식 실행 개념', 'claude-cli-noninteractive',
   'Claude CLI를 자동화 파이프라인에서 어떻게 활용하는지 강의로 이해한다.',
   'claude-cli', 'intermediate', 'free', true, 2),
  ('24시간 자동화봇 구조 이해', 'autobot-architecture',
   'daemon, relay, worker 구조를 강의 예제로 학습한다. 현재 강의사이트 운영 기능은 아니다.',
   'autobot', 'intermediate', 'premium', true, 3),
  ('Vercel + Supabase 기초', 'vercel-supabase-basics',
   '강의사이트와 SaaS 앱의 기본 인프라를 배운다.',
   'saas-infra', 'beginner', 'free', true, 4);
```

---

## 14. 다운로드 게이트

처리 흐름:

1. 사용자가 `/api/resources/download/[id]` 요청
2. rate limit 확인
3. 서버에서 resource 조회
4. `published` 확인
5. premium 자료면 로그인 및 active membership 확인
6. `file_key`로 R2 presigned URL 생성
7. `increment_resource_download()` RPC로 카운트와 로그 기록
8. presigned URL로 redirect

보안 기준:

- `file_key`는 브라우저 API 응답에 포함하지 않는다.
- R2 bucket은 private으로 둔다.
- presigned URL 만료 시간은 짧게 둔다.
- 무료 자료도 가능하면 같은 route를 거쳐 다운로드한다.

---

## 15. SEO + 법률

### sitemap

포함:

- `/`
- `/courses`
- `/courses/[slug]`
- `/membership`
- `/resources`
- `/community`
- `/faq`
- `/youtube`
- `/privacy`
- `/terms`

### 메타데이터

기본 설명은 강의 플랫폼 기준으로 작성한다.

가능:

- "AI와 대화만으로 SaaS를 만드는 법을 배우는 강의 플랫폼"
- "Claude Code, Codex, Supabase, R2를 실전 예제로 배우는 딸깍러"

금지:

- "봇이 직접 운영하는 강의사이트"
- "Claude/Codex worker가 자동 관리하는 플랫폼"

### 법률 페이지

- 개인정보처리방침
- 이용약관
- Footer 링크
- Google 로그인 수집 항목 명시
- 멤버십 수동 부여 운영 방식 명시

---

## 16. ISR 캐시 전략

```typescript
// 강의 목록: 5분
export const revalidate = 300;

// 강의 상세: 5분
export const revalidate = 300;

// FAQ: 1시간
export const revalidate = 3600;

// 홈: 5분
export const revalidate = 300;

// 커뮤니티 목록: 30초
export const revalidate = 30;

// 관리자 CMS: 캐시 없음
export const revalidate = 0;
```

관리자에서 콘텐츠 변경 후 필요한 경로만 `revalidatePath()`로 갱신한다.

---

## 17. 2차 기능

### Kakao 로그인

- Google 로그인 안정화 후 별도 브랜치에서 진행한다.
- Supabase Auth 지원 방식 또는 custom OAuth2를 당시 문서 기준으로 확인한다.
- `state` cookie는 `httpOnly`, `secure`, `sameSite=lax`, `maxAge=600`으로 둔다.

### 결제

- MVP는 수동 멤버십 부여로 시작한다.
- 2차에서 Toss Payments 또는 Stripe 웹훅으로 확장한다.
- 웹훅이 권한 부여의 source of truth가 된다.
- 클라이언트 성공 페이지에서 직접 권한을 부여하지 않는다.

### YouTube API

- 수동 목록 운영이 불편해진 뒤 추가한다.
- API quota, 캐시, 실패 fallback을 먼저 설계한다.

### 실습용 봇 데모

이 항목은 현재 플랜에 포함하지 않는다.  
나중에 필요해지면 "강의 실습 샌드박스"인지 "사이트 운영 기능"인지 먼저 결정한 뒤 별도 문서로 설계한다.

---

## 18. 단계별 실행 계획

### Phase 0: 범위 정리와 봇 기능 제거

- [ ] `plan_claude.md` 기준으로 MVP 범위 재확정
- [ ] 이미 생성된 `bot/` worker 관련 파일 제거 또는 별도 보관
- [ ] 관리자 메뉴에서 봇 태스크 링크 제거
- [ ] 홈/FeatureCards/Hero 카피에서 "사이트가 봇으로 운영된다"는 문장 제거
- [ ] DB migration에서 `bot_tasks`와 관련 RPC 제거
- [ ] `.env.local.example`에서 봇 관련 환경변수 제거

완료 기준: 코드와 문서에서 "사이트 운영 봇"을 전제로 한 구현 항목이 없다.

### Phase 1: 기반 구성

- [ ] `frontend/src` 구조 확인
- [ ] Tailwind 토큰 반영
- [ ] 폰트 로드
- [ ] `next.config.mjs` image remotePatterns 등록
- [ ] `.env.local.example` 정리
- [ ] 관리자 이메일 1개 확정

완료 기준: `npm run dev`로 기본 홈이 렌더링된다.

### Phase 2: DB 스키마 + RLS

- [ ] `001_schema.sql`에서 핵심 테이블 작성
- [ ] `bot_tasks`가 없는지 확인
- [ ] `002_rls.sql` 작성
- [ ] `003_functions.sql` 작성
- [ ] `004_seed_dev.sql` 작성
- [ ] Supabase 대시보드에서 RLS 활성화 확인

완료 기준: 익명 사용자가 premium lesson을 읽을 수 없고, 다른 `user_id`로 글을 작성할 수 없다.

### Phase 3: 서버 유틸 + 공통 UI

- [ ] `lib/server/admin-client.ts`
- [ ] `lib/server/authz.ts`
- [ ] `lib/server/r2.ts`
- [ ] `lib/ratelimit.ts`
- [ ] `lib/utils.ts`
- [ ] Button, Badge, CodeWindow, Tabs, Container
- [ ] TopNav, Footer

완료 기준: `npm run type-check` 통과. `lib/server/bot.ts`가 없어야 한다.

### Phase 4: 인증

- [ ] Supabase Google provider 활성화
- [ ] `app/auth/callback/route.ts`
- [ ] `middleware.ts`
- [ ] 프로필 자동 생성 trigger
- [ ] TopNav 로그인 상태 표시

완료 기준: 로그인 후 `profiles` row가 자동 생성되고 새로고침 후 세션이 유지된다.

### Phase 5: 공개 콘텐츠 페이지

순서:

1. 홈
2. 강의 목록
3. 강의 상세
4. 멤버십
5. 자료실
6. FAQ
7. YouTube
8. 개인정보처리방침/이용약관

완료 기준:

- 빈 데이터 상태에서도 깨지지 않는다.
- 자동화봇/Claude/Codex는 강의 카테고리로만 표시된다.
- 사이트 운영 봇을 암시하는 문구가 없다.

### Phase 6: 관리자 CMS

- [ ] `app/admin/layout.tsx`
- [ ] `app/admin/page.tsx`
- [ ] `app/admin/courses/page.tsx`
- [ ] `app/admin/resources/page.tsx`
- [ ] `app/admin/faqs/page.tsx`
- [ ] `app/admin/members/page.tsx`
- [ ] 관리자 변경 시 `audit_logs` 기록

완료 기준: 관리자가 강의/자료/FAQ/멤버십을 수동으로 관리할 수 있다. `app/admin/bot-tasks`가 없어야 한다.

### Phase 7: 다운로드 게이트

- [ ] `app/api/resources/download/[id]/route.ts`
- [ ] `increment_resource_download` RPC 적용
- [ ] rate limit 적용
- [ ] R2 presigned URL 리다이렉트 확인

완료 기준:

- 비회원 + 무료 자료: 성공
- 비회원 + 프리미엄 자료: 401
- 무료 회원 + 프리미엄 자료: 403
- 멤버십 회원 + 프리미엄 자료: presigned URL redirect

### Phase 8: 커뮤니티

- [ ] `app/community/page.tsx`
- [ ] `app/community/[id]/page.tsx`
- [ ] `app/community/new/page.tsx`
- [ ] `app/api/posts/route.ts`
- [ ] `app/api/comments/route.ts`
- [ ] XSS 방지: MVP는 plain text + 줄바꿈 처리

완료 기준: 다른 사용자 ID로 게시글/댓글 작성이 RLS에서 차단된다. AI 자동 댓글 기능이 없어야 한다.

### Phase 9: 배포

- [ ] Vercel project 연결 (`frontend` root)
- [ ] production/preview 환경변수 분리
- [ ] Supabase Auth redirect URL 등록
- [ ] R2 bucket CORS 정책 설정
- [ ] 도메인 연결 + Cloudflare DNS
- [ ] `NEXT_PUBLIC_SITE_URL` 실제 도메인으로 업데이트
- [ ] smoke test 수행

Smoke test:

- 로그인
- 로그아웃
- 강의 목록/상세
- 자료 다운로드
- 관리자 접근 차단
- 관리자 CMS 변경
- 커뮤니티 글/댓글 작성

---

## 19. 테스트 체크리스트

### RLS

```sql
-- 익명 사용자는 premium lesson을 볼 수 없어야 함
SET request.jwt.claims TO '{}';
SELECT id, title, video_url FROM lessons WHERE tier = 'premium';

-- 사용자는 다른 user_id로 게시글을 INSERT할 수 없어야 함
SET request.jwt.claims TO '{"sub": "user-a-uuid", "role": "authenticated"}';
INSERT INTO posts (user_id, board, title, content)
VALUES ('other-user-uuid', 'qa', '테스트', '내용');

-- 관리자는 관리자 테이블을 통해 판별되어야 함
SELECT is_admin();
```

### API

```bash
# 비회원 + 프리미엄 자료는 401
curl -w "%{http_code}" https://ddkker.com/api/resources/download/1

# Rate limit 확인
for i in {1..11}; do
  curl -w "%{http_code}\n" https://ddkker.com/api/resources/download/1
done
```

### UI

- [ ] 375px: 햄버거 메뉴, 카드 1열
- [ ] 768px: 카드 2열
- [ ] 1440px: 카드 3열
- [ ] 긴 한글 제목이 레이아웃을 깨지 않음
- [ ] 로그인 전/후 TopNav 상태가 올바름
- [ ] Footer에서 개인정보처리방침/이용약관 접근 가능
- [ ] "봇이 사이트를 운영"한다는 문구가 없음
- [ ] 자동화봇은 강의 카테고리/강의 설명으로만 등장

### 제외 기능 검증

아래 검색 결과가 운영 코드에서 나오지 않아야 한다. 단, `강의핵심지식.md`, 강의 제목, 강의 설명, 카테고리 라벨은 예외다.

```bash
rg -n "bot_tasks|enqueueBotTask|claim_bot_task|recover_stuck_bot_tasks|BOT_SHARED_SECRET|WORKER_ID|TELEGRAM_BOT_TOKEN" frontend supabase
rg -n "봇이 사이트를 운영|사이트를 관리합니다|썸네일 생성 요청|AI 답변 초안" frontend
```

---

## 20. 권장 커밋 단위

```text
docs: clarify course content vs site runtime scope
chore: remove site bot worker artifacts from MVP scope
chore: initialize Next.js frontend structure
feat: add supabase schema and RLS without bot queue
feat: add server utilities and common UI components
feat: add google oauth callback and profile trigger
feat: add public course platform pages
feat: add admin CMS for courses resources faqs members
feat: add r2 download gate with membership check
feat: add community posts and comments
chore: configure vercel deployment
docs: add privacy policy and terms pages
```

---

## 21. 구현자 최종 체크리스트

- [ ] `강의핵심지식.md`는 콘텐츠 원천으로만 사용됨
- [ ] `autobot`, `claude-cli`, `codex-cli`는 강의 카테고리로만 쓰임
- [ ] 사이트 운영용 `bot/` worker가 없음
- [ ] `bot_tasks` 테이블이 없음
- [ ] 관리자 메뉴에 봇 태스크가 없음
- [ ] 자동 썸네일 생성/AI 댓글/worker 로그 UI가 없음
- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 `NEXT_PUBLIC_` 접두사 없이 서버 전용 모듈에서만 사용됨
- [ ] `file_key`가 public API 응답에 포함되지 않음
- [ ] 모든 INSERT는 서버 세션의 user_id를 기준으로 함
- [ ] RLS 정책에 필요한 `USING`과 `WITH CHECK`가 있음
- [ ] 관리자 권한은 서버 `requireAdmin()`에서 차단됨
- [ ] Kakao 로그인은 Google MVP 안정화 후 별도 브랜치에서 진행
- [ ] 결제는 수동 멤버십 검증 후 웹훅 기반으로 확장
- [ ] 개인정보처리방침/이용약관 페이지가 Footer에서 접근 가능함
- [ ] `next/image` remotePatterns에 R2, YouTube, Supabase, Google profile 도메인이 등록됨
- [ ] 각 페이지에 적절한 ISR `revalidate` 값이 설정됨
- [ ] `npm run lint`, `npm run type-check`, `npm run build`가 통과함

---

*딸깍러 plan_claude.md — 2026년 5월 기준*  
*기반: plan.md + plan_codex.md + DESIGN.md + 강의핵심지식.md / 사이트 운영 봇 제외 버전*
