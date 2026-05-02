import "server-only";
import { createClient } from "@supabase/supabase-js";

// 빌드 시 env 미설정이어도 타입 안전하게 초기화
// 실제 쿼리는 런타임에 실행되므로 placeholder URL로 인스턴스 생성은 안전
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder_key"
);
