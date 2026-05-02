import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  await requireAdmin();

  const { data, error } = await adminClient
    .from("memberships")
    .select("*, profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { user_id, tier, expires_at, note } = body;

  if (!user_id?.trim() || !tier) {
    return NextResponse.json({ error: "user_id와 tier는 필수입니다" }, { status: 400 });
  }

  // 기존 활성 멤버십 취소
  await adminClient
    .from("memberships")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("user_id", user_id)
    .eq("status", "active");

  const { data, error } = await adminClient
    .from("memberships")
    .insert({
      user_id: user_id.trim(),
      tier,
      status: "active",
      source: "manual",
      expires_at: expires_at ? new Date(expires_at).toISOString() : null,
      note: note?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await adminClient.rpc("log_admin_action", {
    p_action: "membership_granted",
    p_table: "memberships",
    p_target_id: user_id,
    p_meta: { tier, note },
  });

  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const membershipId = searchParams.get("id");

  if (!membershipId) {
    return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });
  }

  const { error } = await adminClient
    .from("memberships")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("id", membershipId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await adminClient.rpc("log_admin_action", {
    p_action: "membership_revoked",
    p_table: "memberships",
    p_target_id: membershipId,
  });

  return NextResponse.json({ success: true });
}
