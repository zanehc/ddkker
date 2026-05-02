import "server-only";
import { adminClient } from "./admin-client";

type TaskType = "thumbnail" | "qa-assist" | "notification";

interface EnqueueOptions {
  priority?: number;
  idempotencyKey?: string;
  scheduledAt?: Date;
}

/**
 * bot_tasks 테이블에 태스크를 큐잉합니다.
 * 봇 워커가 비동기로 태스크를 처리합니다.
 */
export async function enqueueBotTask(
  type: TaskType,
  payload: Record<string, unknown>,
  options?: EnqueueOptions
): Promise<void> {
  const { error } = await adminClient.from("bot_tasks").insert({
    task_type: type,
    payload,
    priority: options?.priority ?? 0,
    idempotency_key: options?.idempotencyKey,
    scheduled_at: options?.scheduledAt?.toISOString(),
  });
  if (error) throw new Error(`봇 태스크 큐잉 실패: ${error.message}`);
}
