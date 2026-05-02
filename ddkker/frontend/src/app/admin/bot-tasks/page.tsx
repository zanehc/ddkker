import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { enqueueBotTask } from "@/lib/server/bot";
import { revalidatePath } from "next/cache";

export const revalidate = 0;

export const metadata = { title: "봇 태스크" };

async function createThumbnailTask(courseId: number, title: string) {
  "use server";
  await requireAdmin();
  await enqueueBotTask("thumbnail", { course_id: courseId, title }, {
    idempotencyKey: `thumbnail-course-${courseId}-${Date.now()}`,
  });
  revalidatePath("/admin/bot-tasks");
}

export default async function BotTasksPage() {
  await requireAdmin();

  const { data: tasks } = await adminClient
    .from("bot_tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: courses } = await adminClient
    .from("courses")
    .select("id, title, thumbnail_url")
    .eq("published", true)
    .order("sort_order");

  return (
    <div>
      <h1 className="text-display-md font-serif text-ink mb-8">봇 태스크</h1>

      {/* 썸네일 생성 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6 mb-8">
        <h2 className="text-title-md font-semibold text-ink mb-4">썸네일 생성 요청</h2>
        <p className="text-xs text-muted mb-4">
          Codex $Imagegen으로 강의 썸네일을 생성하고 R2에 업로드합니다.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {(courses ?? []).map((c) => (
            <div key={c.id} className="border border-hairline rounded-lg p-4">
              <p className="text-sm font-medium text-ink mb-2 line-clamp-2">{c.title}</p>
              {c.thumbnail_url
                ? <p className="text-xs text-success mb-2">✓ 썸네일 있음</p>
                : <p className="text-xs text-muted mb-2">썸네일 없음</p>
              }
              <form action={createThumbnailTask.bind(null, c.id, c.title)}>
                <button type="submit"
                  className="text-xs text-primary hover:text-primary-active font-medium transition-colors">
                  {c.thumbnail_url ? "재생성 요청" : "생성 요청"} →
                </button>
              </form>
            </div>
          ))}
          {(courses ?? []).length === 0 && (
            <p className="text-muted text-sm col-span-3">
              공개된 강의가 없습니다.
            </p>
          )}
        </div>
      </section>

      {/* 태스크 로그 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6">
        <h2 className="text-title-md font-semibold text-ink mb-4">태스크 로그</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-muted">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">유형</th>
                <th className="pb-3 pr-4">상태</th>
                <th className="pb-3 pr-4">시도</th>
                <th className="pb-3 pr-4">오류</th>
                <th className="pb-3">생성일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {(tasks ?? []).map((t) => (
                <tr key={t.id}>
                  <td className="py-3 pr-4 text-muted">{t.id}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{t.task_type}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-pill text-xs font-semibold uppercase ${
                      t.status === "done"    ? "bg-success/10 text-success" :
                      t.status === "failed"  ? "bg-red-100 text-red-600" :
                      t.status === "claimed" ? "bg-accent-amber/20 text-amber-700" :
                                               "bg-surface-card text-muted"
                    }`}>{t.status}</span>
                  </td>
                  <td className="py-3 pr-4 text-muted">{t.attempts}/{t.max_attempts}</td>
                  <td className="py-3 pr-4 text-xs text-red-500 max-w-[200px] truncate">
                    {t.error ?? "-"}
                  </td>
                  <td className="py-3 text-muted text-xs">
                    {new Date(t.created_at).toLocaleString("ko")}
                  </td>
                </tr>
              ))}
              {(tasks ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted text-sm">
                    아직 봇 태스크가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
