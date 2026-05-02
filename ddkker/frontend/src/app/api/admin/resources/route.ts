import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  await requireAdmin();

  const { data, error } = await adminClient
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { title, description, category, file_key, file_type, tier } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "제목은 필수입니다" }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from("resources")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      category: category || null,
      file_key: file_key?.trim() || null,
      file_type: file_type?.trim() || null,
      tier: tier || "free",
      published: false,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await adminClient.rpc("log_admin_action", {
    p_action: "resource_created",
    p_table: "resources",
    p_target_id: String(data.id),
    p_meta: { title },
  });

  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });

  const { error } = await adminClient
    .from("resources")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
