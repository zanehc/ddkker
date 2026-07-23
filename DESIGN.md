# 딸깍러 강의 사이트 — DESIGN.md

> "AI와 대화만으로 SaaS를 만든다" — 바이브코딩 강의 플랫폼 디자인 스펙

---

## Overview

딸깍러는 Claude.com의 따뜻한 크림 에디토리얼 미학을 기반으로, **일렉트릭 인디고**(`#5B4FD9`)를 시그니처 포인트 컬러로 사용하는 바이브코딩 강의 플랫폼이다. "코드 한 줄 없이 AI와 대화해서 SaaS를 만든다"는 컨셉에 맞게, 크림 캔버스의 접근성과 인디고의 AI·자동화 연상이 결합된다.

### 핵심 원칙
- **크림 캔버스 기반** (`#faf9f5`) — Claude.com과 동일하게 따뜻하고 에디토리얼한 느낌 유지
- **인디고 시그니처** (`#5B4FD9`) — 코랄 대신 인디고로 고유 브랜드 구축. AI·자동화·창의성 연상
- **한글 서체 적용** — Noto Serif KR (디스플레이 세리프) + Pretendard (본문 산세리프)
- **다크 네이비 코드카드** (`#181715`) — 실제 CLI 명령어·코드 모크업 카드로 강의 신뢰성 표현
- **오빠두엑셀식 강의 구조** — 카테고리 탭 필터 + 강의 카드 그리드 + 커뮤니티 게시판

### 브랜드 마크
- 로고: "딸깍러" 워드마크 + 커서(▌) 또는 클릭 아이콘 접두사
- 슬로건: "클릭 하나로 SaaS를 만든다"

---

## Colors

### 브랜드 & 액센트

| 토큰 | 값 | 용도 |
|---|---|---|
| `primary` | `#5B4FD9` | 시그니처 인디고. 모든 주요 CTA 배경, 풀블리드 인디고 콜아웃 카드, 로고 액센트 |
| `primary-active` | `#4338CA` | 호버·프레스 시 더 진한 인디고 |
| `primary-disabled` | `#E5E4F5` | 비활성화 상태 — 탈채도 인디고 틴트 |
| `accent-teal` | `#5db8a6` | 보조 상태 표시 (터미널 연결 도트, "실행 중" 인디케이터) |
| `accent-amber` | `#e8a55a` | 카테고리 배지, 인라인 강조 (난이도 "중급" 등) |

### 서피스

| 토큰 | 값 | 용도 |
|---|---|---|
| `canvas` | `#faf9f5` | 기본 페이지 배경. 따뜻한 크림 — 순백색 금지 |
| `surface-soft` | `#f5f0e8` | 섹션 구분 배경 밴드, 통계 섹션 |
| `surface-card` | `#efe9de` | 피처 카드, 강의 카드, 자료실 카드 배경 |
| `surface-cream-strong` | `#e8e0d2` | 선택된 카테고리 탭, 강조 섹션 밴드 |
| `surface-dark` | `#181715` | 코드 에디터 모크업, 풀터 배경. 지배적인 다크 서피스 |
| `surface-dark-elevated` | `#252320` | 다크 밴드 내부 카드 (코드 에디터 패널 등) |
| `surface-dark-soft` | `#1f1e1b` | 코드 블록 내부 배경 |
| `hairline` | `#e6dfd8` | 크림 서피스 위 1px 보더 |
| `hairline-soft` | `#ebe6df` | 동일 밴드 내 부드러운 구분선 |

### 텍스트

| 토큰 | 값 | 용도 |
|---|---|---|
| `ink` | `#141413` | 모든 헤드라인과 주요 텍스트. 따뜻한 다크 |
| `body-strong` | `#252523` | 강조 단락, 리드 텍스트 |
| `body` | `#3d3d3a` | 기본 본문 텍스트 |
| `muted` | `#6c6a64` | 서브 헤딩, 메타 정보, 날짜, 카테고리 레이블 |
| `muted-soft` | `#8e8b82` | 캡션, 저작권, 푸터 보조 텍스트 |
| `on-primary` | `#ffffff` | 인디고 버튼 위 텍스트 |
| `on-dark` | `#faf9f5` | 다크 서피스 위 텍스트 (캔버스 톤 에코) |
| `on-dark-soft` | `#a09d96` | 푸터 본문, 다크 모크업 보조 레이블 |

### 시맨틱

| 토큰 | 값 | 용도 |
|---|---|---|
| `success` | `#5db872` | 완료 표시, 멤버십 체크리스트 ✓ |
| `warning` | `#d4a017` | 주의 배지 (드물게 사용) |
| `error` | `#c64545` | 유효성 오류 |
| `youtube-red` | `#FF0000` | YOUTUBE 페이지 구독 버튼 전용 |

---

## Typography

### 폰트 패밀리

| 역할 | 폰트 | 폴백 |
|---|---|---|
| 디스플레이 세리프 | **Noto Serif KR** (weight 400) | `"Noto Serif KR", "Noto Serif", Georgia, serif` |
| 본문 산세리프 | **Pretendard** (weight 400–600) | `"Pretendard", -apple-system, "Apple SD Gothic Neo", sans-serif` |
| 코드 | **JetBrains Mono** | `"JetBrains Mono", "Fira Code", monospace` |

> Noto Serif KR은 Google Fonts에서 무료 제공. Pretendard는 GitHub 릴리즈 또는 CDN.
> 두 폰트 모두 한국어·영어 혼용 콘텐츠에 최적화.

### 계층 구조

| 토큰 | 크기 | 굵기 | 행간 | 자간 | 용도 |
|---|---|---|---|---|---|
| `display-xl` | 56px | 400 | 1.1 | -1.2px | 홈 H1 — Noto Serif KR |
| `display-lg` | 44px | 400 | 1.15 | -0.8px | 섹션 헤드 — Noto Serif KR |
| `display-md` | 34px | 400 | 1.2 | -0.4px | 서브 섹션 헤드, 멤버십 플랜명 |
| `display-sm` | 26px | 400 | 1.25 | -0.2px | 가격, 콜아웃 헤드라인 |
| `title-lg` | 20px | 600 | 1.35 | 0 | 카드 제목 강조 — Pretendard |
| `title-md` | 17px | 600 | 1.4 | 0 | 강의 카드 제목, 피처 카드 제목 |
| `title-sm` | 15px | 600 | 1.4 | 0 | 자료실 항목, 리스트 레이블 |
| `body-md` | 16px | 400 | 1.6 | 0 | 기본 본문 — Pretendard |
| `body-sm` | 14px | 400 | 1.6 | 0 | 푸터, 세부 설명 |
| `caption` | 13px | 500 | 1.4 | 0 | 배지 레이블, 캡션 |
| `caption-uppercase` | 12px | 600 | 1.4 | 1.2px | 카테고리 태그, "NEW", "FREE" 배지 |
| `code` | 14px | 400 | 1.65 | 0 | 코드 블록 — JetBrains Mono |
| `button` | 14px | 600 | 1.0 | 0.2px | 버튼 레이블 — Pretendard |
| `nav-link` | 14px | 500 | 1.4 | 0 | 네비게이션 메뉴 아이템 |

### 원칙
- 디스플레이는 반드시 weight 400 (볼드 금지). 음수 자간(-0.2px ~ -1.2px)은 필수.
- 본문은 400, 레이블·버튼은 500–600.
- 한글 타이포에서 Noto Serif KR은 Copernicus와 유사한 에디토리얼 느낌 제공.

---

## Layout

### 스페이싱 시스템

| 토큰 | 값 | 용도 |
|---|---|---|
| `spacing-xxs` | 4px | 미세 간격 |
| `spacing-xs` | 8px | 아이콘-레이블 간격, 배지 내부 패딩 |
| `spacing-sm` | 12px | 인라인 버튼 패딩 |
| `spacing-md` | 16px | 기본 간격 |
| `spacing-lg` | 24px | 카드 내부 패딩 (소형), 네비 아이템 간격 |
| `spacing-xl` | 32px | 카드 내부 패딩 (일반), 피처 카드 |
| `spacing-xxl` | 48px | 콜아웃 카드 내부 패딩 |
| `spacing-section` | 96px | 섹션 간 수직 여백 |

### 그리드 & 컨테이너
- **최대 콘텐츠 폭:** 1200px 센터 정렬
- **히어로:** 6/6 컬럼 (왼쪽 H1+CTA, 오른쪽 코드 모크업 카드)
- **강의 카드 그리드:** 데스크톱 3열, 태블릿 2열, 모바일 1열
- **자료실 카드:** 데스크톱 3열, 태블릿 2열
- **멤버십 가격표:** 데스크톱 2–3열, 모바일 1열
- **커뮤니티 게시판:** 단일 컬럼 리스트

---

## Elevation & Depth

| 레벨 | 처리 방식 | 사용처 |
|---|---|---|
| Flat | 그림자 없음, 보더 없음 | 본문 섹션, 히어로 밴드 |
| Hairline | 1px `hairline` 보더 | 입력 필드, 강의 카드, 자료실 카드 |
| Cream card | `surface-card` 배경, 그림자 없음 | 피처 카드, 멤버십 무료 티어 |
| Dark card | `surface-dark` 배경 | 코드 모크업, 멤버십 프리미엄 티어, 풀터 |
| Subtle shadow | `0 1px 3px rgba(20,20,19,0.08)` | 카드 호버 상태 (드물게) |

---

## Components

### 네비게이션 (top-nav)
- 높이: 64px, 배경: `canvas`
- **좌:** 딸깍러 로고 (커서 마크 + "딸깍러" 워드마크, `ink` 색)
- **중:** 소개 | 무료강의 | 멤버십 | 자료실 | 커뮤니티 | FAQ | YOUTUBE (`nav-link` 스타일)
- **우:** 로그인 (`text-link`) + "무료 시작하기" (`button-primary`)
- 모바일: 햄버거 → 전체화면 크림 시트

### 버튼

**button-primary**
- 배경: `primary` (#5B4FD9), 텍스트: `on-primary` (흰색)
- 폰트: `button` (Pretendard 14px/600), 패딩: 12px × 20px, 높이: 40px
- 보더 반지름: `rounded-md` (8px)
- 호버: `primary-active` (#4338CA)

**button-secondary**
- 배경: `canvas`, 텍스트: `ink`, 1px `hairline` 보더
- 동일 패딩·높이·반지름

**button-secondary-on-dark**
- 배경: `surface-dark-elevated`, 텍스트: `on-dark`
- 다크 서피스 위 사용

**button-youtube**
- 배경: `youtube-red` (#FF0000), 텍스트: 흰색
- YOUTUBE 페이지 구독 버튼 전용

**text-link**
- 인라인 `primary` 컬러, 배경 없음. 프레스 시 밑줄

### 카드 & 컨테이너

**hero-band**
- 크림 캔버스 히어로. 6-6 그리드: H1+서브+버튼 (좌), 코드 에디터 모크업 (우)
- 수직 패딩: `spacing-section` (96px)

**course-card**
- 배경: `canvas`, `hairline` 보더, `rounded-lg` (12px)
- 썸네일 (16:9 비율) + 카테고리 배지 + 제목 (`title-md`) + 메타 (난이도, 재생시간) + FREE/멤버십 배지
- 패딩: `spacing-lg` (24px)
- 호버: subtle shadow + 썸네일 살짝 스케일 (1.02)

**feature-card**
- 배경: `surface-card` (#efe9de), `rounded-lg`, 패딩: `spacing-xl` (32px)
- 상단 아이콘 + 제목 (`title-md`) + 설명 (`body-md`)

**code-window-card**
- 배경: `surface-dark`, `rounded-lg`, 패딩: `spacing-lg` (24px)
- 내부 코드 블록: `surface-dark-soft` 배경, JetBrains Mono, 신택스 하이라이팅
- 터미널 탑바: 3개 도트 (빨·노·초) + 파일명 레이블

**resource-card**
- 배경: `canvas`, `hairline` 보더, `rounded-lg`
- 파일타입 아이콘 + 제목 + 설명 + 다운로드 수 + 배지(FREE/멤버십) + 다운로드 버튼
- 멤버십 전용: lock 오버레이 (`surface-dark` 반투명 + 자물쇠 아이콘)

**pricing-tier-card**
- 무료 티어: 배경 `canvas`, `hairline` 보더
- 프리미엄 티어 (featured): 배경 `surface-dark`, 텍스트 `on-dark` — 다크 서피스가 추천 티어 신호
- 패딩: `spacing-xl`, `rounded-lg`
- 플랜명 (`title-lg`) + 가격 (`display-sm`, Noto Serif KR!) + 기능 체크리스트 + CTA 버튼

**callout-card-indigo**
- 배경: `primary` (#5B4FD9), 텍스트: `on-primary` (흰색), `rounded-lg`
- 패딩: `spacing-xxl` (48px)
- 내부 CTA는 반전 버튼 (크림/캔버스 배경 버튼)

**community-post-row**
- 배경: `canvas`, `hairline` 하단 보더
- 카테고리 배지 + 제목 + 작성자 + 날짜 + 댓글수 + 조회수
- 호버: `surface-soft` 배경

**faq-accordion**
- 질문 행: `title-sm` + 펼치기 아이콘 (▼/▲)
- 답변 영역: `body-md`, `surface-soft` 배경, 펼치면 슬라이드 다운
- `hairline` 구분선

**youtube-video-card**
- 배경: `canvas`, `hairline` 보더, `rounded-lg`
- 썸네일 (16:9) + 재생시간 배지 (우하단 오버레이) + 제목 (`title-sm`) + 조회수·날짜 (`caption`, `muted`)

### 태그 / 배지

**badge-pill**
- 배경: `surface-card`, 텍스트: `ink`, `caption`, `rounded-pill`, 패딩: 4px × 10px

**badge-primary**
- 배경: `primary`, 텍스트: 흰색, `caption-uppercase`, `rounded-pill`
- "멤버십", "NEW" 등

**badge-free**
- 배경: `success` (#5db872), 텍스트: 흰색, `caption-uppercase`
- 무료 강의 표시

**badge-difficulty**
- 입문: `accent-teal` 배경 / 중급: `accent-amber` 배경 / 고급: `primary` 배경
- 텍스트: 흰색, `caption-uppercase`

### CTA / 풀터

**cta-band-indigo**
- 프리-풀터 CTA. 배경: `primary` (#5B4FD9), 텍스트: 흰색
- 패딩: 64px, `rounded-lg`
- H2 (`display-sm`, Noto Serif KR!) + 서브라인 + 크림 버튼

**cta-band-dark**
- 개발자 페이지용 대안. 배경: `surface-dark`, `rounded-lg`, 패딩: 64px
- 코드 윈도우 카드와 페어링

**footer**
- 배경: `surface-dark` (#181715), 텍스트: `on-dark-soft`
- 4열 링크 리스트: 강의 / 멤버십 / 커뮤니티 / 회사
- 수직 패딩: 64px
- 상단: 딸깍러 로고 (`on-dark`)
- 절대 반전 없음

---

## Pages

### 1. 홈 (소개)

섹션 순서 리듬: **크림 → 소프트 → 카드 → 크림 → 다크 → 인디고 → 카드 → 다크 → 다크(풀터)**

1. **히어로 밴드** (크림)
   - H1: `"AI와 대화만으로 SaaS를 만든다"` (`display-xl`, Noto Serif KR)
   - 서브: `"코드 한 줄 없이 바이브코딩으로 24시간 자동화봇과 실전 SaaS를 구축하는 강의"` (`body-md`)
   - CTA: [무료 강의 시작하기] (`button-primary`) + [멤버십 보기] (`button-secondary`)
   - 우측: `code-window-card` — Claude CLI 명령어 + 자동화 파이프라인 다이어그램

2. **통계 밴드** (`surface-soft`)
   - 3개 스탯 블록: 누적 수강생 · 전체 강의 수 · 멤버십 회원
   - 각각 숫자 (`display-md`) + 레이블 (`caption`, `muted`)

3. **피처 카드** (`surface-card`, 3열)
   - 바이브코딩 환경 세팅: VS Code + Claude Code + nvm
   - 24시간 자동화봇: daemon_service + relay + worker 구조
   - SaaS 배포 인프라: Vercel + Supabase + Cloudflare R2

4. **최신 강의** (크림)
   - 섹션 헤드 (`display-lg`) + "전체 보기" `text-link`
   - `course-card` 3열 그리드

5. **강의 카테고리 칩** (크림)
   - 가로 스크롤: 바이브코딩 / 자동화봇 / SaaS인프라 / Google로그인 / Claude CLI / Codex CLI

6. **코드 모크업 밴드** (`surface-dark`, 2열)
   - 좌: `code-window-card` (Claude CLI 번역 자동화 코드)
   - 우: 설명 텍스트 (`on-dark`) + CTA (`button-secondary-on-dark`)

7. **인디고 콜아웃** (`callout-card-indigo`)
   - `"API 키 없이 AI 구독만으로 — 지금 바로 시작하세요"`
   - 서브라인 + [무료 시작하기] 크림 반전 버튼

8. **YouTube 프리뷰** (`surface-card`)
   - 최신 영상 3개 `youtube-video-card`

9. **CTA 밴드** (`cta-band-dark`)

10. **풀터** (`surface-dark`)

---

### 2. 무료강의

1. **페이지 헤더** (크림)
   - H1: `"무료 강의"` (`display-lg`)
   - 서브: `"바이브코딩의 모든 것을 무료로 배워보세요"` (`body-md`)

2. **필터 바** (크림, sticky)
   - 카테고리 탭: 전체 / 바이브코딩 / 자동화봇 / SaaS인프라 / Google로그인 / AI CLI
   - 활성 탭: `surface-cream-strong` 배경, `ink` 텍스트
   - 우측: 정렬 드롭다운 (최신순 / 인기순 / 난이도순)

3. **강의 그리드** (3열 → 2열 → 1열)
   - `course-card` × N
   - 멤버십 전용 강의: lock 배지 + 썸네일 블러 처리

4. **페이지네이션** (크림)

5. **인디고 콜아웃** (`callout-card-indigo`) — 멤버십 업그레이드 권유

---

### 3. 멤버십

1. **페이지 헤더** (크림)
   - H1: `"딸깍 멤버십"` (`display-lg`)
   - 서브: `"모든 강의와 자료를 제한 없이"` (`body-md`)
   - 월간/연간 토글 스위치 (연간 선택 시 할인율 `badge-primary` 표시)

2. **가격 티어** (2–3열)
   - **무료** (`pricing-tier-card`): 무료 강의 접근 · 커뮤니티 참여 · 기본 자료실
   - **프리미엄** (`pricing-tier-card` featured/dark): 전체 강의 무제한 · 모든 소스코드 · 라이브 Q&A · 자료실 전체
   - **연간** (옵션, cream + `badge-primary`): 프리미엄 × 12개월 · 추가 할인

3. **기능 비교표** (크림)
   - 행: 기능 항목 / 열: 무료 · 프리미엄
   - 체크(`success` ✓) / 엑스(`muted-soft` –) 아이콘

4. **수강후기** (`surface-card`, 3열)
   - 후기 카드: 아바타(40px 원형) + 이름 + 별점 + 후기 텍스트

5. **멤버십 FAQ** (크림, `faq-accordion`)
   - 5–7개 항목

6. **인디고 콜아웃** (`callout-card-indigo`) — "지금 가입하면 첫 달 무료"

---

### 4. 자료실

1. **페이지 헤더** (크림)
   - H1: `"자료실"` (`display-lg`)
   - 서브: `"강의 소스코드, 템플릿, 설치 가이드를 한 곳에"` (`body-md`)

2. **카테고리 탭** (크림)
   - 전체 / 코드 템플릿 / 강의 자료 / 설치 가이드 / 소스코드

3. **자료 그리드** (3열)
   - `resource-card` × N
   - 멤버십 전용: lock 오버레이 (`surface-dark` 60% 반투명 + 자물쇠 아이콘)

4. **멤버십 게이트 배너** (`surface-dark`, 비회원 전용 표시)
   - `"멤버십 가입 시 모든 자료를 다운로드할 수 있습니다"` + [멤버십 보기] (`button-primary`)

---

### 5. 커뮤니티

1. **페이지 헤더** (크림)
   - H1: `"커뮤니티"` (`display-lg`)
   - 게시판 탭: Q&A / 수강후기 / 프로젝트 공유

2. **액션 바** (크림)
   - 좌: 검색 `text-input`
   - 우: [글쓰기] (`button-primary`)

3. **게시글 리스트** (크림)
   - `community-post-row` × N
   - 공지 게시글: `badge-primary` "공지" + 상단 고정

4. **게시글 상세 페이지**
   - 헤더: 제목 (`display-md`) + 카테고리 배지 + 작성자·날짜
   - 본문: `body-md`, 코드 삽입 시 `code-window-card` 스타일
   - 댓글 섹션: `hairline` 구분선 + textarea + [댓글 등록] (`button-primary`)

5. **페이지네이션**

---

### 6. FAQ

1. **페이지 헤더** (크림)
   - H1: `"자주 묻는 질문"` (`display-lg`)

2. **검색 바** (크림)
   - `text-input` 480px 중앙 정렬

3. **카테고리 탭** (크림)
   - 전체 / 수강 안내 / 멤버십·결제 / 강의 내용 / 기술 문제

4. **아코디언 리스트** (크림)
   - `faq-accordion` × N (카테고리별 그룹화)

5. **추가 문의 CTA** (`surface-soft`)
   - `"해결이 안 됐나요?"` + 커뮤니티 Q&A 이동 `button-secondary`

---

### 7. YOUTUBE

1. **페이지 헤더** (크림)
   - H1: `"유튜브 채널"` (`display-lg`)
   - 서브: 채널 소개 한 줄

2. **채널 스탯 카드** (`surface-card`, 가로형)
   - 채널 썸네일 + 채널명 (`title-lg`) + 구독자 수 + 총 조회수 + [구독하기] (`button-youtube`)

3. **카테고리 탭** (크림)
   - 최신 업로드 / 바이브코딩 / 자동화봇 / SaaS인프라

4. **영상 그리드** (3열)
   - `youtube-video-card` × N

5. **재생목록 섹션** (`surface-card`)
   - 플레이리스트 카드: 썸네일 + 플레이리스트명 + 영상 수 배지

6. **인디고 콜아웃** (`callout-card-indigo`) — 채널 구독 권유

---

## Shapes

| 토큰 | 값 | 용도 |
|---|---|---|
| `rounded-xs` | 4px | 드롭다운 아이템, 미세 장식 |
| `rounded-sm` | 6px | 소형 인라인 버튼, 드롭다운 |
| `rounded-md` | 8px | 버튼, 텍스트 인풋, 카테고리 탭 |
| `rounded-lg` | 12px | 강의 카드, 자료실 카드, 가격 카드, 코드 카드 |
| `rounded-xl` | 16px | 히어로 일러스트 컨테이너, 대형 모크업 |
| `rounded-pill` | 9999px | 배지, "FREE", "NEW", 난이도 태그 |

---

## Responsive

### 브레이크포인트

| 이름 | 폭 | 주요 변화 |
|---|---|---|
| Mobile | < 768px | 햄버거 네비; H1 56→30px; 히어로 단일 컬럼; 강의 그리드 1열; 가격 1열 |
| Tablet | 768–1024px | 강의 카드 2열; 자료실 2열; 가격 2열 |
| Desktop | 1024–1440px | 강의 카드 3열; 자료실 3열; 피처 3열 |
| Wide | > 1440px | 동일, 최대 폭 1200px 캡 |

### 모바일 전략
- 네비 → 햄버거 → 전체화면 크림 시트 (메뉴 아이템 `title-md` 크기로 확대)
- 히어로 6-6 → 단일 컬럼 (텍스트·CTA 먼저, 코드 모크업 카드 아래)
- `code-window-card`: 내부 가로 스크롤 (코드 줄바꿈 금지)
- 프리미엄 다크 티어 카드: 모든 브레이크포인트에서 시각적 강조 유지

---

## Do's and Don'ts

### Do
- 모든 페이지에 크림 캔버스 앵커. 순백색 금지.
- Noto Serif KR로 모든 디스플레이 헤드라인. 음수 자간 필수.
- `primary` 인디고는 주요 CTA 버튼과 풀블리드 콜아웃에만 사용.
- `code-window-card`로 실제 CLI 명령어·코드를 보여줄 것. 추상적인 마케팅 일러스트 금지.
- 크림 피처카드 ↔ 다크 코드카드 교대 배치 — 페이싱 리듬 유지.
- `spacing-section` (96px) 섹션 간 여백 유지.
- 멤버십 추천 티어는 다크 서피스(`surface-dark`)로만 표시.

### Don't
- 쿨 그레이나 순백색 배경 금지. 크림(`#faf9f5`)이 브랜드.
- 세리프 디스플레이 볼드(700) 금지. Noto Serif KR은 weight 400 유지.
- 인디고를 장식용으로 곳곳에 뿌리지 말 것. CTA·콜아웃에만 진하게.
- 연속된 두 섹션에 동일 서피스 모드 금지.
- 코드 블록 내부 줄바꿈 금지 — 가로 스크롤로 처리.
- 제4의 서피스 톤(초록 섹션, 보라 카드 등) 추가 금지. 크림·인디고·다크 네이비 삼위일체.
- `youtube-red`(#FF0000)는 YOUTUBE 페이지 구독 버튼 외 사용 금지.

---

*딸깍러 DESIGN.md — 2026년 5월 기준 / Claude.com 디자인 시스템 방향 B (딸깍 시그니처) 적용*
