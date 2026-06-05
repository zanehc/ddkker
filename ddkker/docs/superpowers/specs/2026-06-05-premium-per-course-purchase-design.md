# 멤버십 → 프리미엄(강의별 구매) 전환 설계

> 작성일: 2026-06-05
> 상태: 승인됨 (구현 계획 작성 전)

## 1. 목표

기존 "멤버십 = 모든 프리미엄 콘텐츠 전체 해금" 구독형 모델을 제거하고,
**강의별 개별 구매 = 그 강의만 영구 수강** 소유형 모델로 전환한다.
결제는 포트원(PortOne V2)으로 실제 연동하며, 결제한 사용자만 해당 강의를 수강할 수 있게 서버에서 게이팅한다.

### 확정 사항 (사용자 승인)

- 범위: 구조 + 실제 포트원 결제 + 웹훅까지 이번에 모두 구현
- PG: **포트원(PortOne)**
- 접근 권한: **1회 구매 = 영구 수강**, 해당 강의에 연결된 자료(소스코드 등)까지 포함
- `memberships` 테이블/개념 **완전 폐기**, `enrollments`로 대체
- `/membership` → `/premium` 라우트 전환
- 자료(`resources`)를 `course_id`로 강의에 연결

## 2. 핵심 강의 (프리미엄 3종)

| 강의 | slug | category | price(원) |
|---|---|---|---|
| 바이브코딩 실무응용 | `vibe-coding-advanced` | `vibe-coding` | 150,000 |
| 로컬AI를 활용한 효율적인 토큰관리 전략 | `local-ai-token-strategy` | `local-ai` | 500,000 |
| CLI 기반 응용프로그램 오케스트레이션 | `cli-app-orchestration` | `cli-orchestration` | 300,000 |

production 시드 마이그레이션으로 삽입, `tier='premium'`, `published=true`.

## 3. 데이터 모델

### 3.1 폐기

- `memberships` 테이블 DROP
- `has_active_membership()` 함수 DROP
- (TypeScript) `MembershipStatus` 타입, `Membership` 인터페이스 제거

### 3.2 신설

**`enrollments`** — 권한의 새 source of truth (강의별 소유, 영구)

```
enrollments
  id          BIGSERIAL PK
  user_id     UUID NOT NULL → profiles(id) ON DELETE CASCADE
  course_id   INTEGER NOT NULL → courses(id) ON DELETE CASCADE
  status      TEXT NOT NULL DEFAULT 'active'  CHECK IN ('active','refunded')
  source      TEXT NOT NULL DEFAULT 'payment' CHECK IN ('payment','manual')
  payment_id  TEXT NULL → payments(payment_id) ON DELETE SET NULL
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  note        TEXT
  UNIQUE(user_id, course_id)
```

**`payments`** — 포트원 거래 기록 (멱등성 키 = payment_id)

```
payments
  payment_id  TEXT PRIMARY KEY        -- 포트원 paymentId (클라가 생성)
  user_id     UUID NOT NULL → profiles(id) ON DELETE CASCADE
  course_id   INTEGER NOT NULL → courses(id) ON DELETE CASCADE
  amount      INTEGER NOT NULL        -- 검증된 결제 금액(원)
  status      TEXT NOT NULL CHECK IN ('paid','failed','cancelled','refunded')
  raw         JSONB                   -- 포트원 결제 조회 응답 원본
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### 3.3 기존 테이블 수정

- `courses`: `price INTEGER NOT NULL DEFAULT 0` 추가 (원, 0=무료).
  `tier='premium'`의 의미를 "유료 = 구매 필요"로 재정의.
- `resources`: `course_id INTEGER NULL → courses(id) ON DELETE SET NULL` 추가.
  premium 자료는 연결된 강의 구매자만 다운로드.
- `courses.category` / `resources` 관련 CHECK 제약에 신규 값 추가:
  - courses.category: `local-ai`, `cli-orchestration` 추가

### 3.4 권한 함수 + RLS 교체

```sql
CREATE FUNCTION is_enrolled(p_course_id INTEGER) RETURNS BOOLEAN
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments
    WHERE user_id = auth.uid()
      AND course_id = p_course_id
      AND status = 'active'
  );
$$;
```

- `lessons` SELECT: `published AND (tier='free' OR is_enrolled(course_id) OR is_admin())`
- `resources` SELECT: `published AND (tier='free' OR (course_id IS NOT NULL AND is_enrolled(course_id)) OR is_admin())`
  - 단, `file_key`는 RLS와 무관하게 항상 서버 API에서만 반환 (기존 원칙 유지)
- `enrollments` SELECT: `auth.uid() = user_id OR is_admin()`. INSERT/UPDATE/DELETE는 service role 전용.
- `payments` SELECT: `auth.uid() = user_id OR is_admin()`. 쓰기는 service role 전용.

## 4. 결제 흐름 (포트원 V2)

```
[강의 상세 /courses/[slug]]
  premium && 미구매 → "구매하기 ₩{price}" 버튼 (로그인 필요)
        ↓ 클릭
[클라] PortOne.requestPayment({
          storeId, channelKey,
          paymentId,            // 클라 생성, 멱등 키
          orderName: course.title,
          totalAmount: course.price,
          customer: { ... }
        })
        ↓ 성공 콜백 (또는 리다이렉트 복귀)
[서버] POST /api/payments/complete  { paymentId, courseId }
  1. 포트원 결제 단건 조회 GET https://api.portone.io/payments/{paymentId}
     (Authorization: PortOne {PORTONE_API_SECRET})
  2. 검증: status === 'PAID'  &&  amount.total === course.price
            && 조회된 주문이 해당 course 와 일치
  3. payments upsert (PK=paymentId → 멱등) + enrollments upsert(user,course)
     (service role 사용, 서버 전용 모듈)
  4. 결과 반환 → 클라는 수강 화면으로
        ↓
[서버] POST /api/payments/webhook   (포트원 → 우리)
  - 웹훅 서명 검증 (PORTONE_WEBHOOK_SECRET)
  - 이벤트별 동기화:
      Transaction.Paid       → payments=paid, enrollments=active (멱등)
      Transaction.Cancelled  → payments=cancelled
      Transaction.*Refund*   → payments=refunded, enrollments.status='refunded'
```

### 검증 원칙

- **프론트 성공 콜백만으로 수강권을 부여하지 않는다.** 반드시 `/complete`에서 서버가 포트원 API로 재조회하여 `status`와 `amount`를 검증한 뒤에만 enrollment를 생성한다. (금액 위변조 차단)
- `paymentId`를 PK로 두어 `/complete`와 웹훅이 동시에 들어와도 중복 부여되지 않게 한다(멱등).
- 환불 발생 시 `enrollments.status='refunded'`로 바꿔 `is_enrolled()`가 false가 되게 한다.

### 환경 변수

| 키 | 위치 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_PORTONE_STORE_ID` | 클라 | 가맹점 식별 |
| `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` | 클라 | 결제 채널 |
| `PORTONE_API_SECRET` | 서버 | 결제 조회/검증 |
| `PORTONE_WEBHOOK_SECRET` | 서버 | 웹훅 서명 검증 |

> 전제: 포트원 가입 → 채널(테스트 모드) 연결 후 위 값 발급 필요(사용자 준비물).
> 코드는 env 플레이스홀더로 스캐폴딩하여 키 주입 전에도 빌드는 통과하게 한다.

## 5. UI / 라우트 변경

- **`/membership` → `/premium` 전환**: 멤버십 페이지를 "프리미엄 강의" 페이지로 재구성.
  `/membership`은 `/premium`으로 redirect. TopNav 라벨 "멤버십" → "프리미엄".
- **`PricingTiers` 컴포넌트 폐기** → **`PremiumCourses`** 신설:
  3개 프리미엄 강의를 가격과 함께 카드로 노출. 상태별 CTA:
  - 비로그인: "로그인 후 구매"
  - 로그인·미구매: "구매하기 ₩{price}"
  - 구매완료: "수강하기" (강의 상세로)
- **강의 상세 `/courses/[slug]`**: 우측/하단에 구매 패널 추가.
  미구매 premium → 구매 버튼 + premium lesson 잠금 표시. 구매완료 → 수강 배지 + 잠금 해제.
- **관리자 `/admin/members`**: "멤버십 부여" → "수강권 부여(enrollment, source='manual')"로 의미 변경.
  사용자 + 강의를 선택해 수동 부여/회수.

## 6. 영향 받는 파일 (예상)

- DB: `supabase/migrations/006_premium_enrollments.sql`(스키마/RLS 교체), `007_seed_premium_courses.sql`(프로덕션 시드)
  - (005는 관리자 RLS/시드로 이미 사용됨)
- 타입: `frontend/src/types/index.ts` (Membership 제거, Enrollment·Payment 추가, Course.price, Resource.course_id)
- 페이지: `app/membership/page.tsx` → `app/premium/page.tsx`(+ redirect), `app/courses/[slug]/page.tsx`
- 컴포넌트: `components/sections/PricingTiers.tsx` 제거, `components/sections/PremiumCourses.tsx` 신설, `components/layout/TopNav.tsx`
- API: `app/api/payments/complete/route.ts`, `app/api/payments/webhook/route.ts`
- 결제 클라 트리거: 강의 상세/프리미엄 페이지에서 호출하는 클라이언트 컴포넌트(`PurchaseButton`)
- 관리자: `app/admin/members/*`, `app/api/admin/members/*`
- 자료 다운로드 게이트: `app/api/resources/download/[id]/route.ts` (course_id 기반 enrollment 검증으로 변경)
- 환경 변수 문서/`.env.example`

## 7. 비범위 (이번에 하지 않음)

- 정기구독/빌링키(구독 결제) — 모든 강의는 1회 구매·영구 수강
- 쿠폰/할인/부분환불 UI
- 강의 번들(여러 강의 묶음 할인)
- 기간제 수강(만료) — 영구 수강만
- plan_claude.md에서 금지한 운영 봇/worker 관련 일체

## 8. 리스크 / 주의

- 포트원 V2 SDK·API 스펙(필드명, 서명 방식)은 구현 시 공식 문서로 재확인 (조회 응답의 `amount.total`, 웹훅 헤더 등).
- `memberships` 폐기 시 기존 베타 수동부여 데이터는 사라짐 → 영향 적으나, 필요 시 005 마이그레이션에서 기존 active membership 보유자를 모든 premium 강의 enrollment로 1회 이관하는 옵션을 둘 수 있음(기본은 미이관).
- 결제 검증·키 취급은 전부 서버 전용 모듈(`server-only`). `PORTONE_API_SECRET`/`SUPABASE_SERVICE_ROLE_KEY` 클라 노출 금지.
