# 딸깍러 SaaS 강의사이트 구축 계획
> **저장 경로:** 승인 후 `/Users/yun/Documents/ddkker/plan.md` 로 저장됩니다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 바이브코딩 강의 플랫폼(딸깍러)을 Vercel + Supabase + Cloudflare R2로 구축하고, Oracle Cloud ARM VM에 Claude Code + Codex 하이브리드 봇을 운영한다.

**Architecture:** Next.js 14 App Router(Vercel) + Supabase(Auth/DB/RLS) + Cloudflare R2(파일). 봇은 Oracle Cloud Always-Free ARM VM(4OCPU/24GB)에서 002.DDKKBOT 패턴 기반 daemon + worker 구조로 실행되며, Supabase `bot_tasks` 테이블을 큐로 사용해 사이트와 통신한다.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + RLS), Cloudflare R2, Vercel, Python 3.11, Claude CLI, Codex CLI, Oracle Cloud ARM VM

**Reference:** Bot 패턴 → `/Users/yun/Documents/Business/002. ddkkbot/` (daemon_service.py, krc_worker.py)

---

## 프로젝트 구조

```
/Users/yun/Documents/ddkker/
├── DESIGN.md                    (완료)
├── 강의핵심지식.md               (완료)
├── frontend/                    (Next.js 14 앱)
│   ├── app/
│   │   ├── layout.tsx           (루트 레이아웃 + 폰트)
│   │   ├── (marketing)/         (공개 페이지 그룹)
│   │   │   ├── page.tsx         (홈/소개)
│   │   │   ├── courses/page.tsx (무료강의)
│   │   │   ├── membership/page.tsx
│   │   │   ├── resources/page.tsx
│   │   │   ├── community/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   └── youtube/page.tsx
│   │   ├── (auth)/
│   │   │   └── auth/callback/route.ts
│   │   └── api/
│   │       ├── auth/kakao/route.ts
│   │       └── resources/download/[id]/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopNav.tsx
│   │   │   └── Footer.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   └── CodeWindow.tsx
│   │   └── sections/
│   │       ├── HeroBand.tsx
│   │       ├── FeatureCards.tsx
│   │       ├── CourseGrid.tsx
│   │       ├── PricingTiers.tsx
│   │       └── FaqAccordion.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        (브라우저 클라이언트)
│   │   │   └── server.ts        (서버 클라이언트)
│   │   ├── r2.ts                (R2 업로드/스트림)
│   │   └── auth/
│   │       └── kakao.ts
│   ├── tailwind.config.ts       (DESIGN.md 토큰 반영)
│   └── middleware.ts            (인증 미들웨어)
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql
│       └── 002_rls.sql
└── bot/                         (Oracle Cloud VM용)
    ├── daemon_service.py        (002.DDKKBOT 기반 단순화)
    ├── worker.py                (bot_tasks 큐 폴러)
    ├── requirements.txt
    ├── .env.example
    └── setup_oracle.sh
```

---

## DB 스키마

```sql
-- supabase/migrations/001_schema.sql

-- 프로필 (auth.users 확장)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  provider TEXT,                    -- 'google' | 'kakao'
  membership_tier TEXT DEFAULT 'free',  -- 'free' | 'premium' | 'annual'
  membership_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 강의
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,    -- 'vibe-coding'|'autobot'|'saas-infra'|'google-auth'|'claude-cli'|'codex-cli'
  difficulty TEXT,  -- 'beginner'|'intermediate'|'advanced'
  duration_min INTEGER,
  thumbnail_url TEXT,
  video_url TEXT,
  tier TEXT DEFAULT 'free',  -- 'free' | 'premium'
  sort_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 자료실
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,    -- 'code-template'|'lecture-material'|'install-guide'|'source-code'
  file_key TEXT,    -- Cloudflare R2 object key
  file_type TEXT,
  file_size_bytes BIGINT,
  download_count INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'free',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 커뮤니티
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  board TEXT DEFAULT 'qa',  -- 'qa' | 'review' | 'project'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ
CREATE TABLE faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,  -- 'enrollment'|'membership'|'content'|'technical'
  sort_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true
);

-- 봇 태스크 큐 (krc_worker 패턴 적용)
CREATE TABLE bot_tasks (
  id SERIAL PRIMARY KEY,
  task_type TEXT NOT NULL,  -- 'thumbnail'|'qa-assist'|'notification'
  payload JSONB,
  status TEXT DEFAULT 'pending',  -- 'pending'|'claimed'|'done'|'failed'
  result JSONB,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  worker_id TEXT,
  error TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

```sql
-- supabase/migrations/002_rls.sql

-- profiles: 본인만 수정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- courses: 퍼블리시된 것만 공개, premium은 멤버만
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_public" ON courses FOR SELECT
  USING (published = true AND (tier = 'free' OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
      AND membership_tier IN ('premium','annual')
      AND (membership_expires_at IS NULL OR membership_expires_at > NOW())
  )));

-- resources: 동일 패턴
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources_public" ON resources FOR SELECT
  USING (published = true AND (tier = 'free' OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
      AND membership_tier IN ('premium','annual')
  )));

-- posts/comments: 로그인 필요
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- faqs: 공개
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs_public" ON faqs FOR SELECT USING (published = true);

-- bot_tasks: 서비스롤만 접근
ALTER TABLE bot_tasks ENABLE ROW LEVEL SECURITY;
-- (bot worker는 service_role key 사용)
```

---

## Phase 1: 프로젝트 초기화

### Task 1-1: 모노레포 + Next.js 세팅

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/app/layout.tsx`

- [ ] Next.js 14 프로젝트 생성

```bash
cd /Users/yun/Documents/ddkker
npx create-next-app@14 frontend \
  --typescript --tailwind --eslint \
  --app --src-dir --no --import-alias "@/*"
cd frontend
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] `tailwind.config.ts`에 DESIGN.md 토큰 반영

```typescript
// frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas:    "#faf9f5",
        primary:   "#5B4FD9",
        "primary-active": "#4338CA",
        "primary-disabled": "#E5E4F5",
        ink:       "#141413",
        body:      "#3d3d3a",
        muted:     "#6c6a64",
        "muted-soft": "#8e8b82",
        hairline:  "#e6dfd8",
        "surface-soft":  "#f5f0e8",
        "surface-card":  "#efe9de",
        "surface-cream-strong": "#e8e0d2",
        "surface-dark":  "#181715",
        "surface-dark-elevated": "#252320",
        "surface-dark-soft": "#1f1e1b",
        "on-primary": "#ffffff",
        "on-dark":    "#faf9f5",
        "on-dark-soft": "#a09d96",
        success: "#5db872",
        "accent-teal": "#5db8a6",
        "accent-amber": "#e8a55a",
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', '"Noto Serif"', "Georgia", "serif"],
        sans:  ["Pretendard", "-apple-system", '"Apple SD Gothic Neo"', "sans-serif"],
        mono:  ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      fontSize: {
        "display-xl": ["56px", { lineHeight: "1.1", letterSpacing: "-1.2px" }],
        "display-lg": ["44px", { lineHeight: "1.15", letterSpacing: "-0.8px" }],
        "display-md": ["34px", { lineHeight: "1.2",  letterSpacing: "-0.4px" }],
        "display-sm": ["26px", { lineHeight: "1.25", letterSpacing: "-0.2px" }],
        "title-lg":   ["20px", { lineHeight: "1.35" }],
        "title-md":   ["17px", { lineHeight: "1.4"  }],
        "title-sm":   ["15px", { lineHeight: "1.4"  }],
      },
      spacing: {
        section: "96px",
      },
      borderRadius: {
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] `app/layout.tsx` — 폰트 로드 + 기본 배경

```typescript
// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "딸깍러 — AI로 SaaS 만들기",
  description: "코드 한 줄 없이 바이브코딩으로 24시간 자동화봇과 SaaS를 구축하는 강의",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSerifKR.variable}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-canvas text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] `globals.css` — 기본 리셋 + 스크롤바 스타일

```css
/* frontend/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root { font-family: "Pretendard Variable", "Pretendard", sans-serif; }
  h1, h2, h3, h4 { font-family: var(--font-serif), serif; font-weight: 400; }
}
```

- [ ] 커밋

```bash
git init && git add -A && git commit -m "feat: Next.js 14 초기화 + DESIGN.md 토큰 Tailwind 반영"
```

---

### Task 1-2: Supabase 프로젝트 + 스키마 적용

**Files:**
- Create: `supabase/migrations/001_schema.sql`
- Create: `supabase/migrations/002_rls.sql`
- Create: `frontend/.env.local.example`

- [ ] Supabase CLI 설치 + 프로젝트 연결

```bash
npm install -g supabase
cd /Users/yun/Documents/ddkker
supabase init
supabase login
supabase link --project-ref <PROJECT_REF>
```

- [ ] 마이그레이션 파일 생성 (위 DB 스키마 섹션 내용 그대로)

```bash
mkdir -p supabase/migrations
# 001_schema.sql, 002_rls.sql 내용 위 DB 스키마 섹션 참조
supabase db push
```

- [ ] `.env.local.example` 작성

```env
# frontend/.env.local.example
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Cloudflare R2
R2_ACCOUNT_ID=xxxx
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
R2_BUCKET_NAME=ddkker
R2_PUBLIC_URL=https://pub-xxxx.r2.dev

# Kakao OAuth
KAKAO_CLIENT_ID=xxxx
KAKAO_CLIENT_SECRET=xxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] Supabase 클라이언트 헬퍼 작성

```typescript
// frontend/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}
```

```typescript
// frontend/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] 커밋

```bash
git add -A && git commit -m "feat: Supabase 스키마 + RLS 마이그레이션"
```

---

## Phase 2: 인증 (Google + Kakao)

### Task 2-1: Google OAuth (Supabase 기본 지원)

**Files:**
- Create: `frontend/app/(auth)/auth/callback/route.ts`
- Create: `frontend/middleware.ts`

- [ ] Supabase 대시보드에서 Google OAuth 활성화
  - Authentication > Providers > Google
  - Google Cloud Console에서 OAuth 클라이언트 ID 발급
  - 리디렉트 URI: `https://<project>.supabase.co/auth/v1/callback`

- [ ] Auth Callback 라우트

```typescript
// frontend/app/(auth)/auth/callback/route.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => cookieStore.set({ name, value, ...options }),
          remove: (name, options) => cookieStore.set({ name, value: "", ...options }),
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 신규 사용자면 profile 생성
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").upsert({
          id: user.id,
          display_name: user.user_metadata.full_name ?? user.email,
          avatar_url: user.user_metadata.avatar_url,
          provider: "google",
        }, { onConflict: "id", ignoreDuplicates: true });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/`);
}
```

- [ ] 미들웨어 — 인증 세션 갱신

```typescript
// frontend/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] 커밋

```bash
git add -A && git commit -m "feat: Google OAuth 콜백 + 미들웨어"
```

---

### Task 2-2: Kakao OAuth

Supabase는 Kakao를 기본 지원하지 않으므로 **커스텀 OAuth2 플로우**로 구현. 카카오 로그인 완료 후 Supabase `signInWithIdToken`으로 세션 생성.

**Files:**
- Create: `frontend/app/api/auth/kakao/route.ts`
- Create: `frontend/app/api/auth/kakao/callback/route.ts`
- Create: `frontend/lib/auth/kakao.ts`

- [ ] Kakao Developers에서 앱 생성
  - https://developers.kakao.com > 내 애플리케이션 > 앱 추가
  - 플랫폼 > Web > 사이트 도메인 등록
  - 카카오 로그인 > 활성화
  - Redirect URI: `https://<SITE_URL>/api/auth/kakao/callback`
  - 동의항목: nickname, profile_image, email (선택)

- [ ] Kakao OAuth 유틸

```typescript
// frontend/lib/auth/kakao.ts
const KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize";
const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const KAKAO_USER_URL = "https://kapi.kakao.com/v2/user/me";

export function getKakaoLoginUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.KAKAO_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/kakao/callback`,
    response_type: "code",
    state,
  });
  return `${KAKAO_AUTH_URL}?${params}`;
}

export async function exchangeKakaoCode(code: string): Promise<{
  access_token: string; kakao_id: number; nickname: string; avatar_url: string; email?: string;
}> {
  const tokenRes = await fetch(KAKAO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.KAKAO_CLIENT_ID!,
      client_secret: process.env.KAKAO_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/kakao/callback`,
      code,
    }),
  });
  const { access_token } = await tokenRes.json();

  const userRes = await fetch(KAKAO_USER_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const user = await userRes.json();

  return {
    access_token,
    kakao_id: user.id,
    nickname: user.kakao_account?.profile?.nickname ?? `user_${user.id}`,
    avatar_url: user.kakao_account?.profile?.thumbnail_image_url ?? "",
    email: user.kakao_account?.email,
  };
}
```

- [ ] Kakao 로그인 시작 API 라우트

```typescript
// frontend/app/api/auth/kakao/route.ts
import { NextResponse } from "next/server";
import { getKakaoLoginUrl } from "@/lib/auth/kakao";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");
  const url = getKakaoLoginUrl(state);
  const response = NextResponse.redirect(url);
  response.cookies.set("kakao_state", state, { httpOnly: true, maxAge: 600 });
  return response;
}
```

- [ ] Kakao 콜백 — 토큰 교환 → Supabase 사용자 생성

```typescript
// frontend/app/api/auth/kakao/callback/route.ts
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeKakaoCode } from "@/lib/auth/kakao";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieStore = cookies();
  const savedState = cookieStore.get("kakao_state")?.value;

  if (!code || state !== savedState) {
    return NextResponse.redirect(`${origin}/?error=kakao_auth_failed`);
  }

  const kakaoUser = await exchangeKakaoCode(code);

  // service_role로 사용자 upsert
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const email = kakaoUser.email ?? `kakao_${kakaoUser.kakao_id}@ddkker.local`;
  const { data: authUser, error } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: kakaoUser.nickname,
      avatar_url: kakaoUser.avatar_url,
      kakao_id: kakaoUser.kakao_id,
    },
  });

  if (error && error.message !== "User already registered") {
    return NextResponse.redirect(`${origin}/?error=kakao_create_failed`);
  }

  // 기존 사용자면 ID 조회
  const userId = authUser?.user?.id ?? (
    await adminClient.auth.admin.listUsers()
      .then(r => r.data.users.find(u => u.email === email)?.id)
  );

  if (!userId) return NextResponse.redirect(`${origin}/?error=kakao_user_not_found`);

  await adminClient.from("profiles").upsert({
    id: userId,
    display_name: kakaoUser.nickname,
    avatar_url: kakaoUser.avatar_url,
    provider: "kakao",
  }, { onConflict: "id", ignoreDuplicates: true });

  // 매직링크로 세션 발급 (service_role 로그인)
  const { data: linkData } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (!linkData?.properties?.hashed_token) {
    return NextResponse.redirect(`${origin}/?error=session_failed`);
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${linkData.properties.hashed_token}&type=magiclink&redirect_to=${origin}/`
  );
}
```

- [ ] 커밋

```bash
git add -A && git commit -m "feat: Kakao OAuth 커스텀 플로우 구현"
```

---

## Phase 3: 공통 레이아웃 컴포넌트

### Task 3-1: TopNav + Footer

**Files:**
- Create: `frontend/components/layout/TopNav.tsx`
- Create: `frontend/components/layout/Footer.tsx`

- [ ] TopNav — 로그인 상태 반영, 모바일 햄버거

```typescript
// frontend/components/layout/TopNav.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "소개" },
  { href: "/courses", label: "무료강의" },
  { href: "/membership", label: "멤버십" },
  { href: "/resources", label: "자료실" },
  { href: "/community", label: "커뮤니티" },
  { href: "/faq", label: "FAQ" },
  { href: "/youtube", label: "YOUTUBE" },
];

export function TopNav({ user }: { user: { email?: string } | null }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 h-16 bg-canvas border-b border-hairline">
      <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 text-ink font-serif text-lg">
          <span className="text-primary font-mono">▌</span>
          <span>딸깍러</span>
        </Link>

        {/* 데스크톱 네비 */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
              className="px-3 py-1.5 text-sm font-medium text-muted hover:text-ink rounded-md transition-colors">
              {label}
            </Link>
          ))}
        </nav>

        {/* 우측 */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button onClick={handleLogout} className="text-sm text-muted hover:text-ink">로그아웃</button>
          ) : (
            <Link href="/api/auth/kakao" className="text-sm text-muted hover:text-ink">로그인</Link>
          )}
          <Link href="/membership"
            className="h-10 px-5 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary-active transition-colors flex items-center">
            무료 시작하기
          </Link>
        </div>

        {/* 햄버거 */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          <span className="sr-only">메뉴</span>
          <div className="w-5 h-0.5 bg-ink mb-1" />
          <div className="w-5 h-0.5 bg-ink mb-1" />
          <div className="w-5 h-0.5 bg-ink" />
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {open && (
        <div className="md:hidden fixed inset-0 top-16 bg-canvas z-40 px-6 py-8 flex flex-col gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className="text-2xl font-serif text-ink">
              {label}
            </Link>
          ))}
          <Link href="/membership" onClick={() => setOpen(false)}
            className="mt-4 h-12 bg-primary text-white text-sm font-semibold rounded-md flex items-center justify-center">
            무료 시작하기
          </Link>
        </div>
      )}
    </header>
  );
}
```

- [ ] Footer

```typescript
// frontend/components/layout/Footer.tsx
import Link from "next/link";

const COLS = [
  { head: "강의", links: [{ href: "/courses", label: "무료강의" }, { href: "/membership", label: "멤버십" }] },
  { head: "커뮤니티", links: [{ href: "/community", label: "Q&A" }, { href: "/community?board=review", label: "수강후기" }] },
  { head: "자료", links: [{ href: "/resources", label: "자료실" }, { href: "/youtube", label: "유튜브" }] },
  { head: "정보", links: [{ href: "/faq", label: "FAQ" }, { href: "#", label: "이용약관" }, { href: "#", label: "개인정보처리방침" }] },
];

export function Footer() {
  return (
    <footer className="bg-surface-dark text-on-dark-soft py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-primary font-mono text-xl">▌</span>
          <span className="text-on-dark font-serif text-lg">딸깍러</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {COLS.map(({ head, links }) => (
            <div key={head}>
              <p className="text-on-dark text-sm font-semibold mb-3">{head}</p>
              {links.map(({ href, label }) => (
                <Link key={label} href={href} className="block text-sm text-on-dark-soft hover:text-on-dark mb-2">{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <p className="text-xs text-on-dark-soft">© 2026 딸깍러. All rights reserved.</p>
      </div>
    </footer>
  );
}
```

- [ ] 커밋

```bash
git add -A && git commit -m "feat: TopNav + Footer 컴포넌트"
```

---

## Phase 4: 핵심 UI 컴포넌트

### Task 4-1: Button, Badge, CodeWindow

**Files:**
- Create: `frontend/components/ui/Button.tsx`
- Create: `frontend/components/ui/Badge.tsx`
- Create: `frontend/components/ui/CodeWindow.tsx`
- Create: `frontend/components/ui/Card.tsx`

- [ ] Button 컴포넌트

```typescript
// frontend/components/ui/Button.tsx
import { cn } from "@/lib/utils";
import Link from "next/link";

type ButtonProps = {
  variant?: "primary" | "secondary" | "secondary-dark" | "text";
  size?: "md" | "lg";
  href?: string;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
};

export function Button({ variant = "primary", size = "md", href, className, onClick, children }: ButtonProps) {
  const base = "inline-flex items-center justify-center font-semibold rounded-md transition-colors";
  const sizes = { md: "h-10 px-5 text-sm", lg: "h-12 px-7 text-base" };
  const variants = {
    primary:        "bg-primary text-white hover:bg-primary-active",
    secondary:      "bg-canvas text-ink border border-hairline hover:bg-surface-soft",
    "secondary-dark": "bg-surface-dark-elevated text-on-dark hover:bg-surface-dark",
    text:           "text-primary hover:underline",
  };
  const cls = cn(base, sizes[size], variants[variant], className);
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}
```

- [ ] Badge 컴포넌트

```typescript
// frontend/components/ui/Badge.tsx
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "free" | "beginner" | "intermediate" | "advanced";

const STYLES: Record<BadgeVariant, string> = {
  default:      "bg-surface-card text-ink",
  primary:      "bg-primary text-white",
  free:         "bg-success text-white",
  beginner:     "bg-accent-teal text-white",
  intermediate: "bg-accent-amber text-white",
  advanced:     "bg-primary text-white",
};

export function Badge({ variant = "default", children, className }: {
  variant?: BadgeVariant; children: React.ReactNode; className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-semibold tracking-wide uppercase",
      STYLES[variant], className
    )}>
      {children}
    </span>
  );
}
```

- [ ] CodeWindow 컴포넌트 (다크 카드, 터미널 탑바)

```typescript
// frontend/components/ui/CodeWindow.tsx
export function CodeWindow({ title = "terminal", children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-dark overflow-hidden">
      {/* 탑바 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-dark-elevated">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-3 text-xs text-on-dark-soft font-mono">{title}</span>
      </div>
      {/* 코드 영역 */}
      <div className="p-6 overflow-x-auto">
        <pre className="font-mono text-sm text-on-dark leading-relaxed whitespace-pre">
          {children}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] `lib/utils.ts` — cn 헬퍼

```typescript
// frontend/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

```bash
npm install clsx tailwind-merge
```

- [ ] 커밋

```bash
git add -A && git commit -m "feat: Button, Badge, CodeWindow UI 컴포넌트"
```

---

## Phase 5: 홈페이지 (소개)

### Task 5-1: Hero + 피처카드 + 인디고 콜아웃

**Files:**
- Create: `frontend/app/(marketing)/page.tsx`
- Create: `frontend/components/sections/HeroBand.tsx`
- Create: `frontend/components/sections/FeatureCards.tsx`

- [ ] HeroBand 컴포넌트

```typescript
// frontend/components/sections/HeroBand.tsx
import { Button } from "@/components/ui/Button";
import { CodeWindow } from "@/components/ui/CodeWindow";

const DEMO_CODE = `# Claude CLI 번역 자동화
$ claude -p "다음 공고를 한국어로 번역해줘" \\
  --output-format text

✓ 번역 완료 → Supabase 저장
✓ Codex $Imagegen → 썸네일 생성
✓ R2 업로드 → URL 반환

[ddkkbot] 24시간 자동화 파이프라인 실행 중...`;

export function HeroBand() {
  return (
    <section className="bg-canvas py-section">
      <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-display-xl font-serif text-ink mb-6 leading-tight">
            AI와 대화만으로<br />SaaS를 만든다
          </h1>
          <p className="text-body text-lg mb-8 leading-relaxed">
            코드 한 줄 없이 바이브코딩으로 24시간 자동화봇과
            실전 SaaS를 구축하는 강의
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/courses" size="lg">무료 강의 시작하기</Button>
            <Button href="/membership" variant="secondary" size="lg">멤버십 보기</Button>
          </div>
        </div>
        <div className="hidden md:block">
          <CodeWindow title="ddkkbot / krc_worker.py">
            {DEMO_CODE}
          </CodeWindow>
        </div>
      </div>
    </section>
  );
}
```

- [ ] FeatureCards 컴포넌트

```typescript
// frontend/components/sections/FeatureCards.tsx
const FEATURES = [
  {
    icon: "⚡",
    title: "바이브코딩 환경 세팅",
    desc: "VS Code + Claude Code + nvm. AI와 대화하며 제품을 만드는 환경을 5분 만에 구축한다.",
  },
  {
    icon: "🤖",
    title: "24시간 자동화봇",
    desc: "daemon_service + relay + worker 구조. Oracle Cloud 무료 VM에서 Claude + Codex가 쉬지 않고 일한다.",
  },
  {
    icon: "🚀",
    title: "SaaS 배포 인프라",
    desc: "Vercel + Supabase + Cloudflare R2. 월 $0~$20으로 운영되는 실전 SaaS 스택.",
  },
];

export function FeatureCards() {
  return (
    <section className="bg-surface-card py-section">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 className="text-display-lg font-serif text-ink mb-12 text-center">무엇을 배우나요</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="bg-canvas rounded-xl p-8 border border-hairline">
              <span className="text-3xl mb-4 block">{icon}</span>
              <h3 className="text-title-md font-semibold text-ink mb-3">{title}</h3>
              <p className="text-body text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] 홈 페이지 조립

```typescript
// frontend/app/(marketing)/page.tsx
import { HeroBand } from "@/components/sections/HeroBand";
import { FeatureCards } from "@/components/sections/FeatureCards";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id,title,slug,category,difficulty,duration_min,thumbnail_url,tier")
    .eq("published", true)
    .eq("tier", "free")
    .order("sort_order")
    .limit(3);

  return (
    <>
      <HeroBand />
      <FeatureCards />

      {/* 최신 강의 */}
      {courses && courses.length > 0 && (
        <section className="bg-canvas py-section">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-display-lg font-serif text-ink">최신 강의</h2>
              <Button href="/courses" variant="text">전체 보기 →</Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {courses.map(c => (
                <div key={c.id} className="bg-canvas border border-hairline rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
                  <div className="aspect-video bg-surface-soft" />
                  <div className="p-6">
                    <p className="text-xs text-muted uppercase tracking-wide mb-2">{c.category}</p>
                    <h3 className="text-title-md font-semibold text-ink mb-2 line-clamp-2">{c.title}</h3>
                    <p className="text-xs text-muted">{c.duration_min}분</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 인디고 콜아웃 */}
      <section className="py-section px-6">
        <div className="max-w-[1200px] mx-auto bg-primary rounded-xl p-12 text-center">
          <h2 className="text-display-sm font-serif text-white mb-4">
            API 키 없이 AI 구독만으로 — 지금 바로 시작하세요
          </h2>
          <p className="text-white/80 mb-8">무료 강의로 시작해서 실전 SaaS를 직접 만들어보세요</p>
          <Button href="/courses" variant="secondary" size="lg">무료 강의 시작하기</Button>
        </div>
      </section>
    </>
  );
}
```

- [ ] 커밋

```bash
git add -A && git commit -m "feat: 홈페이지 Hero + FeatureCards + 인디고 콜아웃"
```

---

## Phase 6: 강의 + 멤버십 + 자료실 페이지

### Task 6-1: 무료강의 페이지

**Files:**
- Create: `frontend/app/(marketing)/courses/page.tsx`
- Create: `frontend/components/sections/CourseGrid.tsx`

- [ ] CourseGrid (필터 탭 + 그리드)

```typescript
// frontend/app/(marketing)/courses/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";

const CATEGORIES = [
  { value: "", label: "전체" },
  { value: "vibe-coding", label: "바이브코딩" },
  { value: "autobot", label: "자동화봇" },
  { value: "saas-infra", label: "SaaS인프라" },
  { value: "google-auth", label: "Google로그인" },
  { value: "claude-cli", label: "Claude CLI" },
  { value: "codex-cli", label: "Codex CLI" },
];

const DIFFICULTY_MAP: Record<string, "beginner" | "intermediate" | "advanced"> = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string };
}) {
  const supabase = createClient();
  const category = searchParams.category ?? "";
  const sort = searchParams.sort ?? "sort_order";

  let query = supabase
    .from("courses")
    .select("*")
    .eq("published", true)
    .order(sort === "created_at" ? "created_at" : "sort_order", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data: courses } = await query;

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <h1 className="text-display-lg font-serif text-ink mb-3">무료 강의</h1>
        <p className="text-body mb-10">바이브코딩의 모든 것을 무료로 배워보세요</p>

        {/* 필터 탭 */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map(({ value, label }) => (
            <a key={value} href={`/courses${value ? `?category=${value}` : ""}`}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                category === value
                  ? "bg-surface-cream-strong text-ink"
                  : "text-muted hover:text-ink"
              }`}>
              {label}
            </a>
          ))}
        </div>

        {/* 그리드 */}
        <div className="grid md:grid-cols-3 gap-6">
          {(courses ?? []).map(c => (
            <div key={c.id} className="bg-canvas border border-hairline rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
              <div className="aspect-video bg-surface-soft relative">
                {c.thumbnail_url && <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />}
                <div className="absolute top-2 right-2">
                  <Badge variant={c.tier === "free" ? "free" : "primary"}>
                    {c.tier === "free" ? "FREE" : "멤버십"}
                  </Badge>
                </div>
              </div>
              <div className="p-6">
                <div className="flex gap-2 mb-2">
                  <Badge variant={DIFFICULTY_MAP[c.difficulty] ?? "beginner"}>
                    {c.difficulty === "beginner" ? "입문" : c.difficulty === "intermediate" ? "중급" : "고급"}
                  </Badge>
                </div>
                <h3 className="text-title-md font-semibold text-ink mb-2 line-clamp-2">{c.title}</h3>
                <p className="text-xs text-muted">{c.duration_min}분</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

---

### Task 6-2: 멤버십 가격 페이지

**Files:**
- Create: `frontend/app/(marketing)/membership/page.tsx`
- Create: `frontend/components/sections/PricingTiers.tsx`

- [ ] PricingTiers 컴포넌트

```typescript
// frontend/components/sections/PricingTiers.tsx
import { Button } from "@/components/ui/Button";

const TIERS = [
  {
    name: "무료",
    price: "₩0",
    period: "영원히",
    dark: false,
    features: [
      "무료 강의 전체 접근",
      "커뮤니티 참여 (Q&A, 수강후기)",
      "기본 자료실 다운로드",
    ],
    cta: { label: "무료로 시작", href: "/courses" },
  },
  {
    name: "프리미엄",
    price: "₩19,900",
    period: "/ 월",
    dark: true,
    features: [
      "전체 강의 무제한 접근",
      "모든 소스코드 다운로드",
      "라이브 Q&A 참여",
      "자료실 전체 열람",
      "커뮤니티 우선 답변",
    ],
    cta: { label: "프리미엄 시작", href: "/membership/checkout" },
  },
];

export function PricingTiers() {
  return (
    <section className="bg-canvas py-section">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {TIERS.map(({ name, price, period, dark, features, cta }) => (
            <div key={name} className={`rounded-xl p-8 border ${
              dark ? "bg-surface-dark border-surface-dark-elevated" : "bg-canvas border-hairline"
            }`}>
              <p className={`text-title-lg font-semibold mb-2 ${dark ? "text-on-dark" : "text-ink"}`}>{name}</p>
              <p className={`font-serif text-display-sm mb-1 ${dark ? "text-on-dark" : "text-ink"}`}>{price}</p>
              <p className={`text-sm mb-8 ${dark ? "text-on-dark-soft" : "text-muted"}`}>{period}</p>
              <ul className="space-y-3 mb-8">
                {features.map(f => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${dark ? "text-on-dark-soft" : "text-body"}`}>
                    <span className="text-success mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Button href={cta.href} variant={dark ? "secondary-dark" : "primary"} className="w-full justify-center">
                {cta.label}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] 멤버십 페이지

```typescript
// frontend/app/(marketing)/membership/page.tsx
import { PricingTiers } from "@/components/sections/PricingTiers";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { createClient } from "@/lib/supabase/server";

export default async function MembershipPage() {
  const supabase = createClient();
  const { data: faqs } = await supabase
    .from("faqs")
    .select("*")
    .eq("category", "membership")
    .eq("published", true)
    .order("sort_order");

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-16 text-center">
        <h1 className="text-display-lg font-serif text-ink mb-3">딸깍 멤버십</h1>
        <p className="text-body">모든 강의와 자료를 제한 없이</p>
      </div>
      <PricingTiers />
      {faqs && faqs.length > 0 && (
        <section className="bg-canvas py-section">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="text-display-md font-serif text-ink mb-10 text-center">멤버십 FAQ</h2>
            <FaqAccordion items={faqs} />
          </div>
        </section>
      )}
    </main>
  );
}
```

---

### Task 6-3: 자료실 페이지 + R2 다운로드

**Files:**
- Create: `frontend/app/(marketing)/resources/page.tsx`
- Create: `frontend/app/api/resources/download/[id]/route.ts`
- Create: `frontend/lib/r2.ts`

- [ ] R2 헬퍼

```typescript
// frontend/lib/r2.ts
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getPresignedDownloadUrl(key: string, expiresIn = 60): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key });
  return getSignedUrl(R2, cmd, { expiresIn });
}
```

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- [ ] 다운로드 API 라우트 (멤버십 게이트 포함)

```typescript
// frontend/app/api/resources/download/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { getPresignedDownloadUrl } from "@/lib/r2";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: resource } = await supabase
    .from("resources")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!resource || !resource.published) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (resource.tier === "premium") {
    if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("membership_tier,membership_expires_at").eq("id", user.id).single();
    const isActive = ["premium","annual"].includes(profile?.membership_tier ?? "") &&
      (!profile?.membership_expires_at || new Date(profile.membership_expires_at) > new Date());
    if (!isActive) return NextResponse.json({ error: "멤버십 필요" }, { status: 403 });
  }

  // 다운로드 카운트 증가
  await supabase.from("resources").update({ download_count: (resource.download_count ?? 0) + 1 }).eq("id", params.id);

  const url = await getPresignedDownloadUrl(resource.file_key);
  return NextResponse.redirect(url);
}
```

- [ ] 자료실 페이지

```typescript
// frontend/app/(marketing)/resources/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";

const CATEGORIES = [
  { value: "", label: "전체" },
  { value: "code-template", label: "코드 템플릿" },
  { value: "lecture-material", label: "강의 자료" },
  { value: "install-guide", label: "설치 가이드" },
  { value: "source-code", label: "소스코드" },
];

export default async function ResourcesPage({ searchParams }: { searchParams: { category?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const category = searchParams.category ?? "";

  let query = supabase.from("resources").select("*").eq("published", true).order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data: resources } = await query;

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <h1 className="text-display-lg font-serif text-ink mb-3">자료실</h1>
        <p className="text-body mb-10">강의 소스코드, 템플릿, 설치 가이드를 한 곳에</p>

        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map(({ value, label }) => (
            <a key={value} href={`/resources${value ? `?category=${value}` : ""}`}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                category === value ? "bg-surface-cream-strong text-ink" : "text-muted hover:text-ink"
              }`}>
              {label}
            </a>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {(resources ?? []).map(r => {
            const locked = r.tier === "premium" && !user;
            return (
              <div key={r.id} className="bg-canvas border border-hairline rounded-xl p-6 relative overflow-hidden">
                {locked && (
                  <div className="absolute inset-0 bg-surface-dark/60 flex flex-col items-center justify-center z-10 rounded-xl">
                    <span className="text-3xl mb-2">🔒</span>
                    <p className="text-on-dark text-sm font-medium">멤버십 전용</p>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{r.file_type === "zip" ? "📦" : r.file_type === "pdf" ? "📄" : "📁"}</span>
                  <div className="flex gap-2">
                    <Badge variant={r.tier === "free" ? "free" : "primary"}>{r.tier === "free" ? "FREE" : "멤버십"}</Badge>
                  </div>
                </div>
                <h3 className="text-title-sm font-semibold text-ink mb-2">{r.title}</h3>
                <p className="text-sm text-body mb-4 line-clamp-2">{r.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{r.download_count}회 다운로드</span>
                  {!locked && (
                    <a href={`/api/resources/download/${r.id}`}
                      className="text-sm font-medium text-primary hover:text-primary-active">
                      다운로드 →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
```

- [ ] 커밋

```bash
git add -A && git commit -m "feat: 강의/멤버십/자료실 페이지 + R2 다운로드 게이트"
```

---

## Phase 7: 커뮤니티, FAQ, YouTube

### Task 7-1: 커뮤니티 게시판

**Files:**
- Create: `frontend/app/(marketing)/community/page.tsx`
- Create: `frontend/app/(marketing)/community/[id]/page.tsx`
- Create: `frontend/app/api/posts/route.ts`
- Create: `frontend/app/api/comments/route.ts`

- [ ] 커뮤니티 목록 페이지

```typescript
// frontend/app/(marketing)/community/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const BOARDS = [
  { value: "qa", label: "Q&A" },
  { value: "review", label: "수강후기" },
  { value: "project", label: "프로젝트 공유" },
];

export default async function CommunityPage({ searchParams }: { searchParams: { board?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const board = searchParams.board ?? "qa";

  const { data: posts } = await supabase
    .from("posts")
    .select("id,title,board,is_pinned,views,created_at,user_id,profiles(display_name)")
    .eq("board", board)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: commentCounts } = await supabase
    .from("comments")
    .select("post_id")
    .in("post_id", (posts ?? []).map(p => p.id));

  const countMap: Record<number, number> = {};
  (commentCounts ?? []).forEach(c => { countMap[c.post_id] = (countMap[c.post_id] ?? 0) + 1; });

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-display-lg font-serif text-ink">커뮤니티</h1>
          {user && <Button href="/community/new">글쓰기</Button>}
        </div>

        <div className="flex gap-2 mb-8">
          {BOARDS.map(({ value, label }) => (
            <a key={value} href={`/community?board=${value}`}
              className={`px-4 py-2 rounded-md text-sm font-medium ${board === value ? "bg-surface-cream-strong text-ink" : "text-muted hover:text-ink"}`}>
              {label}
            </a>
          ))}
        </div>

        <div className="divide-y divide-hairline">
          {(posts ?? []).map(p => (
            <Link key={p.id} href={`/community/${p.id}`}
              className="flex items-center gap-4 py-4 hover:bg-surface-soft px-2 -mx-2 rounded-md transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {p.is_pinned && <Badge variant="primary">공지</Badge>}
                  <span className="text-sm font-medium text-ink truncate">{p.title}</span>
                </div>
                <p className="text-xs text-muted">
                  {(p.profiles as any)?.display_name ?? "익명"} · {new Date(p.created_at).toLocaleDateString("ko")}
                </p>
              </div>
              <div className="flex gap-4 text-xs text-muted shrink-0">
                <span>댓글 {countMap[p.id] ?? 0}</span>
                <span>조회 {p.views}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] 게시글 상세 + 댓글

```typescript
// frontend/app/(marketing)/community/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CommentForm } from "@/components/community/CommentForm";

export default async function PostPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 조회수 증가
  await supabase.rpc("increment_views", { post_id: parseInt(params.id) });

  const { data: post } = await supabase
    .from("posts")
    .select("*, profiles(display_name,avatar_url)")
    .eq("id", params.id)
    .single();

  if (!post) notFound();

  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(display_name,avatar_url)")
    .eq("post_id", params.id)
    .order("created_at");

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[800px] mx-auto px-6 py-16">
        <h1 className="text-display-md font-serif text-ink mb-4">{post.title}</h1>
        <p className="text-sm text-muted mb-8">
          {(post.profiles as any)?.display_name} · {new Date(post.created_at).toLocaleDateString("ko")}
        </p>
        <div className="prose prose-sm max-w-none text-body mb-16 whitespace-pre-wrap">{post.content}</div>

        <div className="border-t border-hairline pt-8">
          <h2 className="text-title-md font-semibold text-ink mb-6">댓글 {(comments ?? []).length}개</h2>
          {(comments ?? []).map(c => (
            <div key={c.id} className="py-4 border-b border-hairline-soft">
              <p className="text-sm font-medium text-ink mb-1">{(c.profiles as any)?.display_name}</p>
              <p className="text-sm text-body">{c.content}</p>
            </div>
          ))}
          {user && <CommentForm postId={post.id} />}
          {!user && <p className="text-sm text-muted mt-6">댓글을 달려면 <a href="/api/auth/kakao" className="text-primary">로그인</a>해주세요.</p>}
        </div>
      </div>
    </main>
  );
}
```

- [ ] CommentForm 클라이언트 컴포넌트

```typescript
// frontend/components/community/CommentForm.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function CommentForm({ postId }: { postId: number }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    await supabase.from("comments").insert({ post_id: postId, user_id: user.id, content });
    setContent("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={4}
        className="w-full border border-hairline rounded-md p-4 text-sm text-ink bg-canvas resize-none focus:outline-none focus:border-primary"
        placeholder="댓글을 입력하세요..."
      />
      <div className="flex justify-end mt-2">
        <Button type="submit" disabled={loading}>{loading ? "등록 중..." : "댓글 등록"}</Button>
      </div>
    </form>
  );
}
```

- [ ] Supabase에 `increment_views` 함수 추가

```sql
-- supabase/migrations/003_functions.sql
CREATE OR REPLACE FUNCTION increment_views(post_id INTEGER)
RETURNS void AS $$
  UPDATE posts SET views = views + 1 WHERE id = post_id;
$$ LANGUAGE SQL SECURITY DEFINER;
```

- [ ] 커밋

```bash
git add -A && git commit -m "feat: 커뮤니티 게시판 + 댓글 시스템"
```

---

### Task 7-2: FAQ + YouTube 페이지

**Files:**
- Create: `frontend/components/sections/FaqAccordion.tsx`
- Create: `frontend/app/(marketing)/faq/page.tsx`
- Create: `frontend/app/(marketing)/youtube/page.tsx`

- [ ] FaqAccordion 클라이언트 컴포넌트

```typescript
// frontend/components/sections/FaqAccordion.tsx
"use client";
import { useState } from "react";

type FaqItem = { id: number; question: string; answer: string; category?: string };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-hairline">
      {items.map(item => (
        <div key={item.id}>
          <button
            onClick={() => setOpen(open === item.id ? null : item.id)}
            className="w-full flex items-center justify-between py-5 text-left"
          >
            <span className="text-title-sm font-semibold text-ink pr-4">{item.question}</span>
            <span className="text-muted shrink-0">{open === item.id ? "▲" : "▼"}</span>
          </button>
          {open === item.id && (
            <div className="pb-5 bg-surface-soft rounded-md px-4 py-4 -mt-1">
              <p className="text-sm text-body leading-relaxed">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] FAQ 페이지

```typescript
// frontend/app/(marketing)/faq/page.tsx
import { createClient } from "@/lib/supabase/server";
import { FaqAccordion } from "@/components/sections/FaqAccordion";

const CATEGORIES = [
  { value: "", label: "전체" },
  { value: "enrollment", label: "수강 안내" },
  { value: "membership", label: "멤버십·결제" },
  { value: "content", label: "강의 내용" },
  { value: "technical", label: "기술 문제" },
];

export default async function FaqPage({ searchParams }: { searchParams: { category?: string } }) {
  const supabase = createClient();
  const category = searchParams.category ?? "";
  let q = supabase.from("faqs").select("*").eq("published", true).order("sort_order");
  if (category) q = q.eq("category", category);
  const { data: faqs } = await q;

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[800px] mx-auto px-6 py-16">
        <h1 className="text-display-lg font-serif text-ink mb-10 text-center">자주 묻는 질문</h1>
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map(({ value, label }) => (
            <a key={value} href={`/faq${value ? `?category=${value}` : ""}`}
              className={`px-4 py-2 rounded-md text-sm font-medium ${category === value ? "bg-surface-cream-strong text-ink" : "text-muted hover:text-ink"}`}>
              {label}
            </a>
          ))}
        </div>
        <FaqAccordion items={faqs ?? []} />
        <div className="mt-16 bg-surface-soft rounded-xl p-8 text-center">
          <p className="text-title-sm font-semibold text-ink mb-3">해결이 안 됐나요?</p>
          <a href="/community?board=qa" className="text-sm text-primary hover:text-primary-active">커뮤니티 Q&A에 질문하기 →</a>
        </div>
      </div>
    </main>
  );
}
```

- [ ] YouTube 페이지 (YouTube Data API 또는 정적 데이터)

```typescript
// frontend/app/(marketing)/youtube/page.tsx
import { Button } from "@/components/ui/Button";

// YouTube Data API v3 연동 또는 정적 영상 목록
// 초기: 정적 데이터로 시작 후 API 연동
const VIDEOS = [
  { id: "VIDEO_ID_1", title: "Claude Code로 SaaS 만들기 완전 가이드", views: "12,000", duration: "24:30" },
  { id: "VIDEO_ID_2", title: "Oracle Cloud 무료 VM에 봇 올리기", views: "8,500", duration: "18:20" },
  { id: "VIDEO_ID_3", title: "Supabase Auth + Kakao 로그인 구현", views: "6,200", duration: "15:45" },
];

const CHANNEL_ID = "YOUR_CHANNEL_ID";

export default function YouTubePage() {
  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <h1 className="text-display-lg font-serif text-ink mb-3">유튜브 채널</h1>
        <p className="text-body mb-10">바이브코딩 실전 강의를 유튜브에서도 만나보세요</p>

        {/* 채널 카드 */}
        <div className="bg-surface-card rounded-xl p-8 flex items-center gap-6 mb-12">
          <div className="w-16 h-16 rounded-full bg-surface-dark flex items-center justify-center text-2xl">▌</div>
          <div className="flex-1">
            <p className="text-title-lg font-semibold text-ink">딸깍러</p>
            <p className="text-sm text-muted">바이브코딩 · SaaS 자동화 · AI 활용</p>
          </div>
          <a href={`https://youtube.com/channel/${CHANNEL_ID}?sub_confirmation=1`} target="_blank" rel="noopener noreferrer"
            className="h-10 px-5 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition-colors flex items-center gap-2">
            ▶ 구독하기
          </a>
        </div>

        {/* 영상 그리드 */}
        <div className="grid md:grid-cols-3 gap-6">
          {VIDEOS.map(v => (
            <a key={v.id} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"
              className="bg-canvas border border-hairline rounded-xl overflow-hidden hover:shadow-sm transition-shadow group">
              <div className="aspect-video bg-surface-dark relative">
                <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title}
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">{v.duration}</span>
              </div>
              <div className="p-4">
                <h3 className="text-title-sm font-semibold text-ink mb-2 line-clamp-2">{v.title}</h3>
                <p className="text-xs text-muted">조회수 {v.views}회</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] 커밋

```bash
git add -A && git commit -m "feat: FAQ 아코디언 + YouTube 페이지"
```

---

## Phase 8: Oracle Cloud 봇 세팅

### Task 8-1: 봇 디렉토리 구조 + 데몬 서비스

002.DDKKBOT의 daemon_service.py를 참조하되, 사이트 연동에 특화된 단순화 버전으로 구현.

**Files:**
- Create: `bot/requirements.txt`
- Create: `bot/.env.example`
- Create: `bot/worker.py`
- Create: `bot/setup_oracle.sh`

- [ ] `bot/requirements.txt`

```
python-dotenv==1.1.1
supabase==2.3.0
boto3==1.34.0
requests==2.32.3
```

- [ ] `bot/.env.example`

```env
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI CLI 경로
CLAUDE_CLI=/home/ubuntu/.npm-global/bin/claude
CODEX_CLI=/home/ubuntu/.npm-global/bin/codex

# Cloudflare R2
R2_ACCOUNT_ID=xxxx
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
R2_BUCKET_NAME=ddkker

# Bot settings
WORKER_POLL_INTERVAL_SEC=60
WORKER_ID=oracle-arm-01
```

- [ ] `bot/worker.py` — Supabase bot_tasks 큐 폴러 (krc_worker.py 패턴 적용)

```python
# bot/worker.py
"""
ddkkbot 사이트 연동 워커
Supabase bot_tasks 테이블을 큐로 사용
krc_worker.py 패턴 기반 (002.DDKKBOT 참조)
"""
import os, sys, json, time, subprocess, re, uuid
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client
import boto3
from botocore.config import Config

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
CLAUDE_CLI   = os.environ.get("CLAUDE_CLI", "claude")
CODEX_CLI    = os.environ.get("CODEX_CLI", "codex")
WORKER_ID    = os.environ.get("WORKER_ID", f"worker-{uuid.uuid4().hex[:8]}")
POLL_SEC     = int(os.environ.get("WORKER_POLL_INTERVAL_SEC", "60"))

R2_ACCOUNT   = os.environ["R2_ACCOUNT_ID"]
R2_KEY       = os.environ["R2_ACCESS_KEY_ID"]
R2_SECRET    = os.environ["R2_SECRET_ACCESS_KEY"]
R2_BUCKET    = os.environ["R2_BUCKET_NAME"]

db = create_client(SUPABASE_URL, SUPABASE_KEY)

TASK_CONCURRENCY = {
    "thumbnail":    1,
    "qa-assist":    2,
    "notification": 3,
}


# ── AI 실행 헬퍼 (krc_worker.run_claude 패턴) ──────────────────────────────

def run_claude(prompt: str, timeout: int = 180) -> str:
    result = subprocess.run(
        [CLAUDE_CLI, "-p", prompt, "--output-format", "text"],
        capture_output=True, text=True, timeout=timeout,
        stdin=subprocess.DEVNULL,
        cwd=str(Path(__file__).parent),
    )
    if result.returncode != 0:
        raise RuntimeError(f"Claude 실패: {result.stderr[:300]}")
    return result.stdout.strip()


def run_codex(prompt: str, timeout: int = 600) -> str:
    result = subprocess.run(
        [CODEX_CLI, "exec",
         "--sandbox", "workspace-write",
         "--skip-git-repo-check",
         prompt],
        capture_output=True, text=True, timeout=timeout,
        stdin=subprocess.DEVNULL,
        cwd=str(Path(__file__).parent),
    )
    if result.returncode != 0:
        raise RuntimeError(f"Codex 실패: {result.stderr[:300]}")
    return result.stdout.strip()


def upload_r2(file_path: str, object_key: str, content_type: str = "image/png") -> str:
    s3 = boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_KEY,
        aws_secret_access_key=R2_SECRET,
        config=Config(signature_version="s3v4", region_name="auto"),
    )
    s3.upload_file(file_path, R2_BUCKET, object_key, ExtraArgs={"ContentType": content_type})
    return object_key


def extract_json(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError("JSON을 찾을 수 없음")


# ── 태스크 핸들러 ────────────────────────────────────────────────────────────

def handle_thumbnail(task: dict) -> dict:
    """Codex $Imagegen으로 강의 썸네일 생성 후 R2 업로드"""
    payload = task["payload"] or {}
    title   = payload.get("title", "강의 썸네일")
    course_id = payload.get("course_id")

    image_path = f"/tmp/thumbnail_{course_id}.png"
    run_codex(f"""
$Imagegen 아래 강의의 썸네일 이미지를 만들어줘.
생성된 이미지를 {image_path} 에 저장해.

강의 제목: {title}
스타일: 모던 테크 스타일. 인디고(#5B4FD9)와 크림(#faf9f5) 컬러. 한국어 텍스트 포함.
크기: 16:9 비율 (1280x720).
""")

    object_key = f"thumbnails/course_{course_id}.png"
    upload_r2(image_path, object_key)

    # courses 테이블 thumbnail_url 업데이트
    db.table("courses").update({"thumbnail_url": f"{os.environ.get('R2_PUBLIC_URL','')}/{object_key}"}) \
      .eq("id", course_id).execute()

    return {"thumbnail_url": object_key}


def handle_qa_assist(task: dict) -> dict:
    """Claude CLI로 Q&A 게시글에 AI 답변 초안 생성"""
    payload  = task["payload"] or {}
    post_id  = payload.get("post_id")
    question = payload.get("title", "") + "\n" + payload.get("content", "")

    answer = run_claude(f"""
다음 바이브코딩/SaaS 관련 질문에 한국어로 답변해줘.
답변은 명확하고 실용적으로, 코드가 필요하면 코드블록으로 작성해.

질문:
{question}

주의: 확실하지 않은 내용은 "확인이 필요합니다"라고 명시.
""")

    # 답변을 댓글로 등록 (bot 계정 user_id 필요 시 service_role로 직접 insert)
    db.table("comments").insert({
        "post_id": post_id,
        "user_id": None,  # 봇 답변은 user_id null 허용 (RLS 조정 필요)
        "content": f"🤖 AI 답변 초안:\n\n{answer}",
    }).execute()

    return {"answer_preview": answer[:200]}


HANDLERS = {
    "thumbnail": handle_thumbnail,
    "qa-assist": handle_qa_assist,
}


# ── 큐 폴링 루프 (krc_worker.process_pending 패턴) ──────────────────────────

def get_pending_tasks(limit: int = 20) -> list:
    result = db.table("bot_tasks") \
        .select("*") \
        .eq("status", "pending") \
        .order("priority") \
        .order("created_at") \
        .limit(limit) \
        .execute()
    return result.data or []


def claim_task(task_id: int) -> bool:
    try:
        db.table("bot_tasks").update({
            "status": "claimed",
            "worker_id": WORKER_ID,
        }).eq("id", task_id).eq("status", "pending").execute()
        return True
    except Exception:
        return False


def complete_task(task_id: int, result: dict):
    db.table("bot_tasks").update({
        "status": "done",
        "result": result,
    }).eq("id", task_id).execute()


def fail_task(task_id: int, error: str, attempts: int, max_attempts: int):
    if attempts < max_attempts:
        db.table("bot_tasks").update({
            "status": "pending",
            "attempts": attempts + 1,
            "error": error,
            "worker_id": None,
        }).eq("id", task_id).execute()
    else:
        db.table("bot_tasks").update({
            "status": "failed",
            "error": error,
        }).eq("id", task_id).execute()


def run_one_task(task: dict):
    task_id  = task["id"]
    task_type = task["task_type"]

    if not claim_task(task_id):
        return  # 다른 워커가 선점

    handler = HANDLERS.get(task_type)
    if not handler:
        fail_task(task_id, f"알 수 없는 task_type: {task_type}", task["attempts"], task["max_attempts"])
        return

    try:
        result = handler(task)
        complete_task(task_id, result)
        print(f"[worker] ✓ task {task_id} ({task_type}) 완료")
    except Exception as e:
        err = str(e)[:500]
        fail_task(task_id, err, task["attempts"], task["max_attempts"])
        print(f"[worker] ✗ task {task_id} ({task_type}) 실패: {err}")


def process_pending() -> int:
    tasks = get_pending_tasks()
    if not tasks:
        return 0

    # task_type별 그룹화
    groups: dict[str, list] = {}
    for t in tasks:
        groups.setdefault(t["task_type"], []).append(t)

    for task_type, group in groups.items():
        max_workers = TASK_CONCURRENCY.get(task_type, 1)
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            list(pool.map(run_one_task, group))

    return len(tasks)


def main():
    print(f"[ddkkbot worker] 시작 — worker_id={WORKER_ID}, poll={POLL_SEC}s")
    while True:
        try:
            count = process_pending()
            if count:
                print(f"[worker] {count}개 태스크 처리 완료")
                continue
        except Exception as e:
            print(f"[worker] 오류: {e}")
        time.sleep(POLL_SEC)


if __name__ == "__main__":
    main()
```

- [ ] `bot/setup_oracle.sh` — Oracle Cloud ARM VM 초기 세팅 스크립트

```bash
#!/bin/bash
# Oracle Cloud ARM VM (Ubuntu 22.04) 세팅
# 실행: chmod +x setup_oracle.sh && sudo ./setup_oracle.sh

set -e

# 기본 패키지
apt-get update && apt-get install -y python3.11 python3-pip python3-venv git curl

# Node.js (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts

# Claude Code CLI
npm install -g @anthropic-ai/claude-code
echo "claude CLI 설치 완료 — claude login 으로 인증 필요"

# Codex CLI
npm install -g @openai/codex
echo "codex CLI 설치 완료 — codex login 으로 인증 필요"

# Python 가상환경
cd /opt/ddkkbot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# systemd 서비스 등록
cat > /etc/systemd/system/ddkkbot.service << 'EOF'
[Unit]
Description=ddkkbot Worker
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/ddkkbot
EnvironmentFile=/opt/ddkkbot/.env
ExecStart=/opt/ddkkbot/.venv/bin/python worker.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ddkkbot
echo "서비스 등록 완료. 'systemctl start ddkkbot' 으로 시작"
```

- [ ] 커밋

```bash
git add bot/ && git commit -m "feat: Oracle Cloud 봇 워커 + systemd 서비스 세팅"
```

---

## Phase 9: 사이트 ↔ 봇 연동 API

### Task 9-1: 봇 태스크 생성 헬퍼 (서버 사이드)

**Files:**
- Create: `frontend/lib/bot.ts`

- [ ] `lib/bot.ts` — bot_tasks 큐에 태스크 추가

```typescript
// frontend/lib/bot.ts
import { createClient } from "@supabase/supabase-js";

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type TaskType = "thumbnail" | "qa-assist" | "notification";

export async function enqueueBotTask(
  type: TaskType,
  payload: Record<string, unknown>,
  priority = 0
) {
  const { error } = await adminClient.from("bot_tasks").insert({
    task_type: type,
    payload,
    priority,
  });
  if (error) throw error;
}
```

사용 예시 — 새 강의 등록 시 썸네일 생성 태스크 큐잉:

```typescript
// 어드민 API 라우트에서
await enqueueBotTask("thumbnail", { course_id: newCourse.id, title: newCourse.title });
```

커뮤니티 Q&A 게시글 등록 시 AI 답변 요청:

```typescript
// 게시글 등록 후 서버 사이드에서
if (board === "qa") {
  await enqueueBotTask("qa-assist", { post_id: post.id, title: post.title, content: post.content }, 1);
}
```

- [ ] 커밋

```bash
git add -A && git commit -m "feat: 봇 태스크 큐 헬퍼 + 사이트-봇 연동 패턴"
```

---

## Phase 10: Vercel 배포

### Task 10-1: Vercel 배포 설정

**Files:**
- Create: `frontend/vercel.json`

- [ ] `vercel.json` 설정

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["icn1"],
  "crons": []
}
```

- [ ] Vercel 대시보드에서 환경변수 등록
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
  - `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`
  - `NEXT_PUBLIC_SITE_URL` (배포 후 실제 도메인으로 업데이트)

- [ ] GitHub 연동 후 자동 배포

```bash
cd frontend
vercel --prod
```

- [ ] 커밋 + 최종 배포

```bash
git add -A && git commit -m "feat: Vercel 배포 설정"
git push origin main
```

---

## 전체 실행 순서 요약

| Phase | 작업 | 산출물 |
|---|---|---|
| 1 | 모노레포 + Supabase 스키마 | ddkker/ 기본 구조, DB 테이블, RLS |
| 2 | 인증 (Google + Kakao) | 소셜 로그인 동작 |
| 3 | 공통 레이아웃 | TopNav, Footer |
| 4 | UI 컴포넌트 | Button, Badge, CodeWindow |
| 5 | 홈페이지 | Hero, FeatureCards, 인디고 콜아웃 |
| 6 | 강의/멤버십/자료실 | 콘텐츠 페이지 + R2 다운로드 게이트 |
| 7 | 커뮤니티/FAQ/YouTube | 게시판 + 아코디언 + 유튜브 그리드 |
| 8 | Oracle Cloud 봇 | 워커 데몬 + systemd 서비스 |
| 9 | 사이트↔봇 연동 | bot_tasks 큐 + enqueueBotTask |
| 10 | 배포 | Vercel (프론트) + Oracle VM (봇) |

## Verification

```bash
# 로컬 개발 서버
cd frontend && npm run dev
# → http://localhost:3000 에서 각 페이지 확인

# Supabase 마이그레이션 확인
supabase db diff

# 봇 워커 로컬 테스트
cd bot && source .venv/bin/activate && python worker.py

# 빌드 오류 없는지 확인
cd frontend && npm run build

# 타입 오류 확인
npm run type-check
```
