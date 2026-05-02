# 딸깍러 SaaS 구축 계획 - Codex 보완판

> 기준 문서: `plan.md`, `DESIGN.md`, `강의핵심지식.md`  
> 작성 목적: 기존 계획의 부족한 부분을 보완하고, 실제 구현자가 순서대로 실행할 수 있는 안정적인 제품 구축 계획으로 재정리한다.

---

## 0. 원본 계획 검토 요약

기존 `plan.md`는 전체 기능 범위와 구현 예시가 풍부하다는 장점이 있다. 다만 바로 개발에 착수하기에는 몇 가지 중요한 공백이 있다.

### 잘 잡힌 부분

- Vercel, Supabase, R2, Oracle Cloud VM이라는 비용 효율적인 SaaS 인프라 방향이 명확하다.
- `DESIGN.md`의 브랜드 방향, 색상, 타이포, 페이지 구성이 상당히 구체적이다.
- 강의 사이트와 봇 워커를 Supabase `bot_tasks` 큐로 연결한다는 큰 구조가 좋다.
- `강의핵심지식.md`의 실제 자동화 경험을 제품 콘텐츠와 기능 구조에 반영하려는 의도가 분명하다.

### 보완이 필요한 핵심 문제

1. **MVP 범위가 너무 넓다.**  
   강의, 멤버십, 자료실, 커뮤니티, FAQ, YouTube, 봇, 썸네일 생성, Q&A AI 답변, 배포까지 한 번에 들어가 있어 우선순위와 릴리즈 기준이 흐려진다.

2. **결제와 멤버십의 실제 운영 모델이 빠져 있다.**  
   가격표는 있지만 결제 제공자, 주문/결제/구독 테이블, 웹훅, 환불, 만료 처리, 수동 권한 부여 방식이 없다.

3. **관리자/CMS가 없다.**  
   강의, 자료, FAQ, YouTube 링크, 공지, 멤버십 권한을 누가 어디서 관리할지 정의되어 있지 않다.

4. **RLS와 권한 정책이 부족하거나 위험하다.**  
   게시글/댓글 작성자가 다른 사용자 ID를 넣을 수 있는 여지가 있고, 프로필 생성 정책이 불완전하며, 프리미엄 자료의 목록 노출과 다운로드 권한 검사가 섞여 있다.

5. **봇 큐의 동시성 처리가 약하다.**  
   `pending` 조회 후 `claimed` 업데이트만으로는 경쟁 상태가 생길 수 있다. stale claim 복구, heartbeat, idempotency key, atomic claim RPC가 필요하다.

6. **폴더 구조가 일관되지 않다.**  
   `create-next-app --src-dir`을 쓰면서 문서의 파일 경로는 `frontend/app`, `frontend/components`처럼 루트 기준으로 되어 있다.

7. **컴파일 오류 가능성이 있는 예시가 있다.**  
   예를 들어 `Button` 컴포넌트 타입에는 `type`, `disabled`가 없는데 사용처에서는 전달한다. 이런 부분은 계획 문서에서 완성 코드처럼 쓰기보다 검증 기준으로 관리해야 한다.

8. **운영 필수 요소가 빠져 있다.**  
   백업, 로그, 모니터링, 에러 추적, 시크릿 관리, 배포 환경 분리, 이메일/알림, 개인정보 처리, 약관, 관리자 감사 로그가 없다.

9. **검증 계획이 부족하다.**  
   `npm run build` 수준을 넘어 RLS 테스트, 다운로드 권한 테스트, 결제 웹훅 테스트, 큐 동시성 테스트, 모바일 UI 스냅샷 검증이 필요하다.

---

## 1. 개선된 제품 원칙

### 제품 목표

딸깍러는 "AI와 대화만으로 SaaS를 만든다"는 컨셉을 가진 바이브코딩 강의 플랫폼이다. 1차 릴리즈의 목표는 다음 세 가지다.

- 무료 강의와 핵심 자료를 통해 신뢰를 만든다.
- 멤버십 전환이 가능한 구조를 갖춘다.
- 강의 콘텐츠와 자동화 봇 경험을 하나의 브랜드 경험으로 연결한다.

### 구현 원칙

- **작게 출시하고 확장한다.** MVP는 공개 강의, 자료실, 로그인, 관리자 등록, 기본 멤버십 권한까지로 제한한다.
- **권한은 DB와 서버에서 검증한다.** UI의 lock 표시는 보조 수단이다. 실제 접근 제어는 RLS, 서버 라우트, 웹훅에서 처리한다.
- **서비스 롤 키는 서버 전용이다.** `SUPABASE_SERVICE_ROLE_KEY`는 `server-only` 모듈 또는 봇에서만 사용한다.
- **콘텐츠 목록과 파일 다운로드 권한을 분리한다.** 프리미엄 자료의 카드 메타데이터는 보여줄 수 있지만, 파일 키와 실제 다운로드 URL은 서버에서 검증 후 발급한다.
- **봇은 비동기 작업자다.** 사용자 요청 흐름을 막지 않고, 실패와 재시도를 기록하며, 중복 실행을 막는다.
- **디자인은 `DESIGN.md`를 단일 기준으로 삼는다.** 색상, 타이포, 섹션 리듬, 크림/인디고/다크 네이비 조합을 유지한다.

---

## 2. MVP 범위 재정의

### MVP에 포함

- Next.js 앱 기본 구조
- Supabase Auth Google 로그인
- Kakao 로그인은 설계 검증 후 2차로 구현
- 프로필 자동 생성
- 공개 페이지: 홈, 무료강의, 멤버십, 자료실, 커뮤니티 목록/상세, FAQ, YouTube
- 관리자 보호 페이지: 강의, 자료, FAQ, 공지, YouTube 링크 등록/수정
- R2 자료 다운로드 게이트
- 기본 멤버십 권한 모델
- 커뮤니티 글/댓글 작성
- 봇 태스크 큐 테이블과 관리자에서 수동 태스크 생성
- Oracle Cloud worker 최소 실행
- Vercel 배포와 환경변수 분리

### MVP에서 제외하거나 2차로 미룸

- 자동 결제 정기구독 전체 구현
- Codex 이미지 생성 기반 썸네일 자동화의 완전 자동 운영
- YouTube Data API 자동 동기화
- 라이브 Q&A 예약 시스템
- 강의 진도율, 수료증, 알림센터
- 고급 검색, 추천, 랭킹

### 1차 릴리즈 완료 기준

- 운영 URL에서 회원가입/로그인/로그아웃이 동작한다.
- 관리자가 강의와 자료를 등록할 수 있다.
- 비회원은 무료 강의와 무료 자료만 접근 가능하다.
- 멤버십 권한이 있는 사용자는 프리미엄 자료 다운로드가 가능하다.
- 커뮤니티 글/댓글 작성 권한이 작성자 기준으로 제한된다.
- `npm run build`, 타입 검사, RLS 권한 테스트, 다운로드 권한 테스트가 통과한다.

---

## 3. 기술 결정사항

### 프론트엔드

- `frontend/src` 구조를 사용한다.
- 모든 앱 경로는 `frontend/src/app` 아래에 둔다.
- 공통 컴포넌트는 `frontend/src/components`, 서버 전용 유틸은 `frontend/src/lib/server` 아래에 둔다.
- `@/*` alias는 `frontend/src/*`를 가리킨다.
- Tailwind 토큰은 `DESIGN.md`의 색상과 타이포를 기준으로 한다.
- UI 라이브러리를 도입하지 않고, 필요한 컴포넌트만 로컬로 만든다.

### 백엔드/API

- Next.js Route Handler를 사용한다.
- Supabase anon client는 사용자 세션 기반 작업에만 사용한다.
- service role client는 `server-only` 모듈에서만 생성한다.
- 긴 작업은 API에서 처리하지 않고 `bot_tasks` 큐에 넣는다.

### 데이터베이스

- PostgreSQL check constraint 또는 enum으로 상태 값을 제한한다.
- `created_at`, `updated_at`을 기본 컬럼으로 둔다.
- 권한 결정용 테이블과 공개 표시용 테이블을 분리한다.
- 다운로드 카운트, 조회수 증가는 RPC로 원자적으로 처리한다.

### 봇

- 봇은 Supabase service role key를 사용한다.
- 작업 선점은 RPC로 원자적으로 처리한다.
- `claimed_at`, `heartbeat_at`, `idempotency_key`를 기록한다.
- 실패한 작업은 재시도 횟수와 마지막 에러를 저장한다.

---

## 4. 개선된 프로젝트 구조

```text
/Users/yun/Documents/ddkker/
├── DESIGN.md
├── 강의핵심지식.md
├── plan.md
├── plan_codex.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css
│   │   │   ├── page.tsx
│   │   │   ├── courses/page.tsx
│   │   │   ├── membership/page.tsx
│   │   │   ├── resources/page.tsx
│   │   │   ├── community/page.tsx
│   │   │   ├── community/[id]/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── youtube/page.tsx
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
│   │   │       └── bot/tasks/route.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── sections/
│   │   │   ├── ui/
│   │   │   ├── community/
│   │   │   └── admin/
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   ├── server/
│   │   │   │   ├── admin-client.ts
│   │   │   │   ├── authz.ts
│   │   │   │   ├── bot.ts
│   │   │   │   └── r2.ts
│   │   │   └── utils.ts
│   │   └── types/
│   ├── package.json
│   ├── tailwind.config.ts
│   └── .env.local.example
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql
│   │   ├── 002_rls.sql
│   │   ├── 003_functions.sql
│   │   └── 004_seed_dev.sql
│   └── tests/
│       └── rls.test.sql
└── bot/
    ├── worker.py
    ├── requirements.txt
    ├── .env.example
    ├── systemd/ddkkbot.service
    └── scripts/healthcheck.sh
```

---

## 5. 데이터 모델 보완

### 핵심 테이블

원본 스키마에 아래 개념을 추가한다.

| 영역 | 추가/수정 | 이유 |
|---|---|---|
| 프로필 | `updated_at`, `role`, `marketing_opt_in` | 관리자 권한과 사용자 설정 분리 |
| 관리자 | `admin_users` | `profiles.role`만 믿지 않고 관리자 목록을 명시 |
| 강의 | `lessons` 테이블 추가 | 강의 목록과 실제 수업 단위를 분리 |
| 멤버십 | `memberships`, `payment_events` | 결제와 권한의 이력을 남김 |
| 자료실 | `resource_downloads` | 다운로드 로그, 남용 감지, 통계 |
| 커뮤니티 | `post_reactions`, `post_reports`는 2차 | MVP에서는 보류 가능 |
| 봇 큐 | `claimed_at`, `heartbeat_at`, `idempotency_key` | 중복 실행과 stuck task 방지 |
| 감사 로그 | `audit_logs` | 관리자 작업 추적 |

### 멤버십 권한 모델

MVP에서는 결제를 나중에 붙일 수 있도록 권한 테이블을 먼저 만든다.

```sql
CREATE TABLE memberships (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('premium','annual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','canceled','refunded')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','payment','promo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

권한 판단은 `profiles.membership_tier`에 직접 의존하지 않고 `memberships`의 active row를 기준으로 한다. `profiles`에는 화면 표시용 요약만 캐시할 수 있다.

### 콘텐츠 공개 모델

프리미엄 콘텐츠도 목록에서는 보여줄 수 있어야 전환이 가능하다. 따라서 목록과 상세/다운로드 권한을 분리한다.

- `courses`: published metadata는 공개
- `lessons`: premium lesson의 실제 `video_url`, `body`, `resource_key`는 권한 있는 사용자만
- `resources`: title, description, category, tier는 공개 가능
- `resources.file_key`: 클라이언트로 직접 반환 금지
- 다운로드는 `/api/resources/download/[id]`에서 권한 확인 후 presigned URL 발급

### 봇 큐 보완

```sql
ALTER TABLE bot_tasks
  ADD COLUMN claimed_at TIMESTAMPTZ,
  ADD COLUMN heartbeat_at TIMESTAMPTZ,
  ADD COLUMN idempotency_key TEXT,
  ADD COLUMN scheduled_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX bot_tasks_idempotency_key_idx
  ON bot_tasks(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
```

작업 선점은 SQL RPC로 처리한다.

```sql
CREATE OR REPLACE FUNCTION claim_bot_task(p_worker_id TEXT)
RETURNS SETOF bot_tasks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH next_task AS (
    SELECT id
    FROM bot_tasks
    WHERE status = 'pending'
      AND scheduled_at <= NOW()
      AND attempts < max_attempts
    ORDER BY priority ASC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  UPDATE bot_tasks t
  SET status = 'claimed',
      worker_id = p_worker_id,
      claimed_at = NOW(),
      heartbeat_at = NOW(),
      attempts = attempts + 1
  FROM next_task
  WHERE t.id = next_task.id
  RETURNING t.*;
END;
$$;
```

---

## 6. RLS와 보안 보완

### 프로필

- 신규 사용자 프로필은 DB trigger 또는 서버 콜백에서 생성한다.
- 사용자는 본인 프로필만 수정할 수 있다.
- 관리자는 관리자 API를 통해서만 멤버십 요약 정보를 수정한다.

필수 정책:

- `profiles_select_public`: 공개 필드만 view로 제공하는 방향 권장
- `profiles_update_own`: `auth.uid() = id`
- `profiles_insert`는 일반 사용자가 직접 호출하지 않도록 trigger 사용

### 커뮤니티

원본 정책은 `auth.uid() IS NOT NULL`만 확인하므로 작성자 위조 가능성이 있다. 아래처럼 `WITH CHECK`를 반드시 넣는다.

```sql
CREATE POLICY posts_insert_own ON posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY posts_update_own ON posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY comments_insert_own ON comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

봇 댓글이 필요하면 `user_id NULL`을 허용하기보다 `bot_users` 또는 `profiles`에 봇 계정을 만들고 service role로 해당 ID를 넣는다.

### 관리자

관리자 여부는 서버에서만 판단한다.

- `admin_users(user_id)` 테이블을 둔다.
- `is_admin()` SQL 함수와 서버 `requireAdmin()` 유틸을 만든다.
- 관리자 Route Handler는 항상 `requireAdmin()`을 먼저 호출한다.
- 모든 관리자 변경은 `audit_logs`에 기록한다.

### 파일 보안

- R2 bucket은 private가 기본이다.
- 공개 이미지가 필요하면 별도 prefix 또는 public bucket을 사용한다.
- 다운로드용 자료는 presigned URL만 발급한다.
- `file_key`는 클라이언트 응답에 포함하지 않는다.
- 다운로드 카운트는 `increment_resource_download(resource_id, user_id)` RPC에서 처리한다.

### 환경변수

`.env.local.example`은 아래처럼 공개/서버/봇을 나눠 적는다.

```env
# Public browser-safe
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only
SUPABASE_SERVICE_ROLE_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# Bot
BOT_SHARED_SECRET=
```

---

## 7. 인증 계획

### Phase A: Google 로그인 우선

1차는 Supabase 기본 OAuth provider인 Google로 먼저 안정화한다.

작업:

- Supabase Google provider 활성화
- `/auth/callback` route 구현
- 프로필 자동 생성 trigger 추가
- `middleware.ts`로 세션 갱신
- `TopNav`에서 로그인 상태 표시
- 로그인/로그아웃 e2e 확인

완료 기준:

- 신규 사용자가 로그인하면 `profiles` row가 생성된다.
- 로그아웃 후 프리미엄 다운로드 API가 401 또는 403을 반환한다.
- 로그인 세션이 새로고침 후 유지된다.

### Phase B: Kakao 로그인 별도 검증

Kakao는 원본처럼 무리하게 magic link 우회를 먼저 넣지 않는다. 구현 전 아래 결정을 완료한다.

- Supabase Auth에서 Kakao를 공식 provider로 쓸 수 있는지 확인
- 불가능하다면 커스텀 OAuth 플로우를 별도 Edge Function 또는 서버 route로 구현
- 계정 연결 기준을 email로 할지, provider user id로 할지 결정
- `state` cookie는 `httpOnly`, `secure`, `sameSite=Lax`, 짧은 만료로 설정
- `admin.listUsers()` 전체 스캔 금지
- 가짜 이메일 도메인을 쓸 경우 계정 병합 정책 문서화

Kakao는 1차 릴리즈를 막는 블로커로 두지 않는다.

---

## 8. 관리자/CMS 계획

원본 계획의 가장 큰 공백은 관리자 기능이다. 강의 사이트는 콘텐츠 운영이 핵심이므로 최소 CMS가 필요하다.

### 관리자 화면

| 경로 | 기능 |
|---|---|
| `/admin` | 운영 요약, 최근 가입자, 최근 다운로드, 실패한 봇 태스크 |
| `/admin/courses` | 강의 생성/수정/공개 여부/정렬 |
| `/admin/resources` | 자료 메타데이터 등록, R2 key 연결, 공개 여부 |
| `/admin/faqs` | FAQ 등록/정렬 |
| `/admin/members` | 멤버십 수동 부여/만료/취소 |
| `/admin/bot-tasks` | 봇 태스크 생성, 재시도, 실패 로그 확인 |

### 관리자 구현 원칙

- 모든 관리자 페이지는 server component에서 `requireAdmin()`으로 보호한다.
- mutation은 server action 또는 route handler로 처리한다.
- 파일 업로드는 MVP에서 직접 업로드보다 R2 key 입력으로 시작한다.
- 관리자가 변경한 내용은 `audit_logs`에 남긴다.

### 시드 데이터

개발과 데모를 위해 `004_seed_dev.sql` 또는 seed script를 둔다.

- 무료 강의 6개
- 프리미엄 강의 3개
- 자료 6개
- FAQ 8개
- YouTube 샘플 3개
- 관리자 계정 1개는 수동으로 등록

---

## 9. 프론트엔드 구현 계획

### Phase 1: 앱 기반 공사

작업:

- `frontend` 생성
- `src` 구조 확정
- Tailwind 토큰 반영
- Pretendard, Noto Serif KR, JetBrains Mono 로드
- `Button`, `Badge`, `Card`, `CodeWindow`, `Container`, `Tabs` 구현
- `TopNav`, `Footer` 구현
- `cn` 유틸 추가

주의:

- `Button`은 `React.ButtonHTMLAttributes<HTMLButtonElement>`를 확장해 `type`, `disabled`를 지원한다.
- 링크 버튼과 일반 버튼 타입을 분리하거나 `asChild` 패턴을 명확히 한다.
- `img` 대신 `next/image` 사용 여부를 페이지별로 결정한다.
- 모바일 네비는 접근성 속성 `aria-expanded`, `aria-controls`를 포함한다.

검증:

- `npm run lint`
- `npm run type-check`
- 모바일 375px, 태블릿 768px, 데스크톱 1440px에서 주요 페이지 확인

### Phase 2: 공개 페이지

구현 순서:

1. 홈
2. 무료강의
3. 멤버십
4. 자료실
5. 커뮤니티 목록/상세
6. FAQ
7. YouTube

각 페이지 완료 기준:

- 빈 데이터 상태가 있다.
- 로딩 실패 시 깨지지 않는다.
- 모바일에서 텍스트와 버튼이 겹치지 않는다.
- `DESIGN.md`의 섹션 리듬을 지킨다.
- CTA가 실제 경로로 연결된다.

### Phase 3: 상호작용

- 커뮤니티 글쓰기/댓글 작성
- 자료 다운로드 버튼
- 카테고리 필터
- FAQ 아코디언
- 관리자 콘텐츠 등록/수정

주의:

- 게시글 본문은 XSS 방지를 위해 markdown 렌더링 전 sanitize 정책을 정한다.
- MVP에서는 plain text와 줄바꿈 보존으로 시작해도 충분하다.
- 필터는 URL query string 기반으로 유지한다.

---

## 10. 결제와 멤버십 계획

### MVP 방식

1차 릴리즈는 자동 결제 없이 관리자 수동 부여로 시작한다.

이유:

- 결제 웹훅과 환불 처리는 버그가 나면 운영 리스크가 크다.
- 먼저 콘텐츠와 권한 게이트가 잘 동작하는지 확인해야 한다.
- 수동 부여만으로도 초기 베타 멤버 운영이 가능하다.

### 2차 결제 연동

결제 제공자를 선택한 후 아래 구조를 추가한다.

- `checkout_sessions`
- `orders`
- `payment_events`
- `memberships`
- `/api/payments/webhook`

원칙:

- 웹훅이 권한 부여의 source of truth다.
- 클라이언트 성공 페이지는 권한을 직접 부여하지 않는다.
- 같은 결제 이벤트가 여러 번 와도 idempotency key로 한 번만 처리한다.
- 환불/취소/만료 이벤트도 membership 상태를 갱신한다.

---

## 11. 자료실과 R2 계획

### 구현 흐름

1. 관리자가 R2에 파일을 업로드한다.
2. 관리자 페이지에서 `resources` row에 `file_key`, `file_type`, `file_size_bytes`, `tier`를 등록한다.
3. 사용자가 자료실에서 카드를 본다.
4. 다운로드 클릭 시 서버 route가 로그인과 멤버십을 확인한다.
5. 권한이 있으면 presigned URL을 발급하고 다운로드 로그를 남긴다.

### 필수 검증

- 비회원이 무료 자료를 다운로드할 수 있다.
- 비회원이 프리미엄 자료 다운로드 시 401 또는 로그인 유도 응답을 받는다.
- 무료 회원이 프리미엄 자료 다운로드 시 403을 받는다.
- active membership 사용자는 presigned URL을 받는다.
- `download_count`는 동시 요청에서도 정확히 증가한다.

---

## 12. 커뮤니티 계획

### MVP 기능

- 게시판 탭: Q&A, 수강후기, 프로젝트 공유
- 게시글 목록
- 게시글 상세
- 로그인 사용자 글쓰기
- 로그인 사용자 댓글 작성
- 작성자 본인 수정/삭제는 2차로 미룰 수 있음
- 관리자는 공지 고정과 숨김 처리 가능

### 보안/품질

- `user_id`는 클라이언트 입력값을 믿지 않고 서버에서 세션 기준으로 넣는다.
- RLS에서도 `auth.uid() = user_id`를 강제한다.
- 긴 본문 제한, 댓글 길이 제한, rate limit을 둔다.
- 조회수 증가는 RPC로 처리하되, 과도한 중복 증가 방지는 2차에서 개선한다.

---

## 13. 봇과 큐 계획

### MVP 봇 범위

MVP에서는 봇의 목적을 "큐 처리 구조 검증"으로 제한한다.

포함:

- `bot_tasks` 조회
- atomic claim RPC 사용
- `qa-assist` 텍스트 답변 초안 생성
- 실패/재시도 기록
- worker health log

2차:

- Codex 기반 썸네일 생성
- R2 이미지 업로드 자동화
- 관리자 페이지에서 재시도/취소
- Discord/Slack 알림

### 워커 안정성

필수 항목:

- 단일 인스턴스 lock 또는 systemd 단일 서비스
- `claim_bot_task()` RPC 사용
- `heartbeat_at` 주기적 업데이트
- stuck task 복구 job
- stdout 로그와 파일 로그 분리
- 환경변수 누락 시 명확한 실패 메시지

### Oracle Cloud 세팅 보완

원본 `setup_oracle.sh`에는 `/opt/ddkkbot` 생성, 코드 배포, 권한, nvm 설치 사용자 문제가 빠져 있다. 개선판에서는 아래 순서로 분리한다.

1. 서버 사용자와 디렉토리 준비
2. Node/Python 설치
3. Claude/Codex CLI 설치와 로그인
4. repo clone 또는 배포 archive 복사
5. `.env` 배치
6. venv 생성과 requirements 설치
7. systemd 서비스 등록
8. `systemctl status ddkkbot` 확인
9. 테스트 태스크 1개 처리

---

## 14. 배포와 운영 계획

### 환경 분리

| 환경 | 용도 |
|---|---|
| local | 개발 |
| preview | PR/브랜치별 검증 |
| production | 실제 운영 |

환경별로 Supabase project를 분리하는 것이 가장 안전하다. 비용이나 관리 부담 때문에 하나만 쓴다면 최소한 seed와 테스트 데이터 prefix를 분리한다.

### Vercel 배포

필수:

- `frontend`를 root directory로 설정
- 환경변수 production/preview 분리
- build command: `npm run build`
- type-check를 CI에서 별도 실행
- 배포 후 callback URL과 `NEXT_PUBLIC_SITE_URL`을 실제 도메인으로 갱신

### 모니터링

MVP 최소 운영 체크:

- Vercel function error log 확인
- Supabase Auth/Database log 확인
- bot worker systemd status 확인
- 실패한 `bot_tasks` 관리자 화면에서 확인
- R2 다운로드 오류 로그 확인

### 백업

- Supabase 자동 백업 정책 확인
- 마이그레이션 파일은 git으로 관리
- R2 주요 자료는 로컬 또는 별도 저장소에 원본 보관
- 관리자 삭제 기능은 soft delete부터 시작

---

## 15. 테스트 계획

### 로컬 자동 검증

```bash
cd frontend
npm run lint
npm run type-check
npm run build
```

### DB/RLS 테스트

테스트해야 할 케이스:

- 익명 사용자는 공개 강의 목록을 볼 수 있다.
- 익명 사용자는 프리미엄 lesson 본문을 볼 수 없다.
- 로그인 사용자는 자기 프로필만 수정할 수 있다.
- 사용자는 다른 사람의 `user_id`로 게시글을 만들 수 없다.
- 사용자는 다른 사람의 댓글을 수정할 수 없다.
- 관리자만 콘텐츠를 생성/수정할 수 있다.
- service role만 `bot_tasks`를 직접 읽고 수정할 수 있다.

### API 테스트

- `/api/resources/download/[id]`
- `/api/posts`
- `/api/comments`
- `/api/bot/tasks`
- `/auth/callback`

### UI 테스트

- 홈, 강의, 멤버십, 자료실, 커뮤니티, FAQ, YouTube, 관리자 화면
- 375px, 768px, 1440px 폭 확인
- 모바일 메뉴 열기/닫기
- 긴 한글 제목과 긴 URL이 레이아웃을 깨지 않는지 확인

---

## 16. 단계별 실행 계획

### Phase 0: 정리와 기준 확정

- [ ] `frontend/src` 구조로 통일
- [ ] MVP 범위 확정
- [ ] Google 우선, Kakao 2차 원칙 확정
- [ ] 수동 멤버십 부여 방식 확정
- [ ] 관리자 이메일 1개 확정

완료 기준:

- 팀/작업자가 같은 경로와 범위를 보고 작업할 수 있다.

### Phase 1: DB 스키마와 RLS

- [ ] `001_schema.sql` 작성
- [ ] `002_rls.sql` 작성
- [ ] `003_functions.sql` 작성
- [ ] `004_seed_dev.sql` 작성
- [ ] RLS 테스트 케이스 작성

완료 기준:

- Supabase migration이 깨끗하게 적용된다.
- 권한 테스트가 통과한다.

### Phase 2: Next.js 기반 구축

- [ ] Next.js 앱 생성
- [ ] Tailwind 토큰 반영
- [ ] 폰트 로드
- [ ] Supabase browser/server client 작성
- [ ] service role client를 server-only로 작성
- [ ] 공통 UI 컴포넌트 작성

완료 기준:

- 빈 홈 페이지가 디자인 토큰을 사용해 렌더링된다.
- lint/type/build가 통과한다.

### Phase 3: 인증과 프로필

- [ ] Google OAuth 설정
- [ ] callback route 구현
- [ ] middleware 구현
- [ ] profile trigger 또는 upsert 구현
- [ ] TopNav 로그인 상태 연결

완료 기준:

- 신규 로그인 시 profile이 생성된다.
- 로그아웃과 세션 유지가 정상 동작한다.

### Phase 4: 공개 콘텐츠 페이지

- [ ] 홈
- [ ] 강의 목록
- [ ] 멤버십 소개
- [ ] 자료실
- [ ] FAQ
- [ ] YouTube

완료 기준:

- seed 데이터로 모든 페이지가 깨지지 않고 표시된다.
- 모바일/데스크톱 주요 레이아웃이 정상이다.

### Phase 5: 관리자/CMS

- [ ] 관리자 보호 레이아웃
- [ ] 강의 관리
- [ ] 자료 관리
- [ ] FAQ 관리
- [ ] 멤버십 수동 부여
- [ ] 감사 로그 기록

완료 기준:

- 관리자가 브라우저에서 콘텐츠를 등록하고 공개 페이지에서 확인할 수 있다.

### Phase 6: 자료 다운로드 게이트

- [ ] R2 server helper
- [ ] 다운로드 API
- [ ] membership 검사 유틸
- [ ] 다운로드 RPC
- [ ] 다운로드 로그

완료 기준:

- free/premium 권한 케이스별 API 응답이 기대와 일치한다.

### Phase 7: 커뮤니티

- [ ] 게시글 목록/상세
- [ ] 글쓰기 API
- [ ] 댓글 API
- [ ] 작성자 RLS 확인
- [ ] 관리자 공지/숨김 최소 기능

완료 기준:

- 로그인 사용자가 글과 댓글을 작성할 수 있고, 다른 사용자 ID 위조가 막힌다.

### Phase 8: 봇 큐

- [ ] `bot_tasks` queue helper
- [ ] atomic claim RPC
- [ ] Python worker
- [ ] local worker 테스트
- [ ] Oracle systemd 서비스

완료 기준:

- 테스트 태스크가 `pending -> claimed -> done`으로 이동한다.
- 실패 태스크가 재시도 후 `failed`가 된다.

### Phase 9: 배포

- [ ] Vercel project 연결
- [ ] 환경변수 등록
- [ ] Supabase redirect URL 등록
- [ ] R2 bucket/private policy 확인
- [ ] production build
- [ ] smoke test

완료 기준:

- production URL에서 로그인, 콘텐츠 조회, 다운로드 권한, 관리자 접근이 정상이다.

---

## 17. 구현자가 특히 주의할 체크리스트

- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 client bundle에 포함되지 않는지 확인한다.
- [ ] `file_key`가 public API 응답에 섞이지 않는지 확인한다.
- [ ] 모든 insert/update는 서버 세션의 user id를 기준으로 한다.
- [ ] RLS 정책에 `USING`과 `WITH CHECK`를 모두 필요한 곳에 둔다.
- [ ] 관리자 권한은 UI 표시가 아니라 서버에서 차단한다.
- [ ] 다운로드 카운트와 조회수 증가는 RPC로 처리한다.
- [ ] 봇 task claim은 단순 update가 아니라 `FOR UPDATE SKIP LOCKED` 기반 RPC로 처리한다.
- [ ] stuck `claimed` task를 복구하는 운영 절차를 둔다.
- [ ] Kakao 로그인은 Google MVP 안정화 후 별도 브랜치에서 구현한다.
- [ ] 결제는 수동 멤버십으로 먼저 검증한 뒤 웹훅 기반으로 붙인다.

---

## 18. 권장 커밋 단위

1. `chore: initialize frontend workspace`
2. `feat: add supabase schema and rls policies`
3. `feat: add design tokens and base layout`
4. `feat: add google auth and profile bootstrap`
5. `feat: add public course and resource pages`
6. `feat: add admin content management`
7. `feat: add membership gate for resources`
8. `feat: add community posts and comments`
9. `feat: add bot task queue and worker`
10. `chore: configure production deployment`

---

## 19. 최종 산출물 정의

1차 릴리즈가 끝났을 때 저장소에는 다음이 있어야 한다.

- `frontend` Next.js 앱
- Supabase migration 전체
- RLS 테스트 문서 또는 SQL 테스트
- 관리자 CMS
- R2 다운로드 게이트
- 커뮤니티 기본 기능
- 봇 worker와 systemd 설정
- `.env.local.example`, `bot/.env.example`
- 배포 체크리스트
- 운영자용 간단 README

---

## 20. 결론

기존 계획은 "무엇을 만들지"를 충분히 보여준다. 이 보완판은 "무엇부터, 어떤 위험을 막으면서, 어떤 기준으로 완료할지"를 명확히 하는 데 초점을 둔다.

가장 중요한 변경은 세 가지다.

1. Google 로그인, 공개 콘텐츠, 관리자 CMS, 수동 멤버십을 먼저 완성한다.
2. RLS, 다운로드 권한, service role 격리, 봇 큐 동시성을 초기에 바로잡는다.
3. 결제, Kakao, 자동 썸네일, YouTube API는 핵심 흐름이 안정화된 뒤 붙인다.

이 순서로 가면 데모 가능한 제품을 빠르게 만들면서도, 나중에 운영 기능을 붙일 때 구조를 갈아엎지 않아도 된다.
