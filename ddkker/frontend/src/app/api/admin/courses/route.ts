import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  await requireAdmin();

  const { data, error } = await adminClient
    .from("courses")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { title, slug, description, category, difficulty, tier, price, highlights, sort_order } = body;

  if (!title?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: "제목과 슬러그는 필수입니다" }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from("courses")
    .insert({
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      description: description?.trim() || null,
      category: category || null,
      difficulty: difficulty || null,
      tier: tier || "free",
      price: Number.isFinite(price) ? price : 0,
      highlights: Array.isArray(highlights) ? highlights : [],
      sort_order: sort_order ?? 0,
      published: false,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await adminClient.rpc("log_admin_action", {
    p_action: "course_created",
    p_table: "courses",
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
    .from("courses")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await adminClient.rpc("log_admin_action", {
    p_action: "course_updated",
    p_table: "courses",
    p_target_id: String(id),
    p_meta: updates,
  });

  return NextResponse.json({ success: true });
}
