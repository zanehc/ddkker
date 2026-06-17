import "server-only";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "./admin-client";
import { redirect } from "next/navigation";

/**
 * 로그인 사용자를 요구합니다.
 * 미로그인 시 홈(/)으로 리디렉트합니다.
 */
export async function requireAuth() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return user;
}

/**
 * 관리자 권한을 요구합니다.
 * admin_users 테이블에 없으면 홈(/)으로 리디렉트합니다.
 */
export async function requireAdmin() {
  const user = await requireAuth();
  const { data } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .single();
  if (!data) redirect("/");
  return user;
}

/**
 * 사용자가 관리자(admin_users)인지 확인합니다. (리디렉트 없이 boolean 반환)
 */
export async function isUserAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const { data } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

/**
 * 사용자의 활성 멤버십 여부를 확인합니다.
 */
export async function hasActiveMembership(userId: string): Promise<boolean> {
  const { data } = await adminClient
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .limit(1)
    .single();
  return !!data;
}
