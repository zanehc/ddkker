import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { enqueueBotTask } from "@/lib/server/bot";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  await requireAdmin();

  const { data, error } = await adminClient
    .from("bot_tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { task_type, payload, priority, idempotency_key } = body;

  const validTypes = ["thumbnail", "qa-assist", "notification"];
  if (!task_type || !validTypes.includes(task_type)) {
    return NextResponse.json(
      { error: "유효한 task_type이 필요합니다" },
      { status: 400 }
    );
  }

  await enqueueBotTask(task_type, payload ?? {}, {
    priority: priority ?? 0,
    idempotencyKey: idempotency_key,
  });

  await adminClient.rpc("log_admin_action", {
    p_action: "bot_task_enqueued",
    p_table: "bot_tasks",
    p_meta: { task_type, payload },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
