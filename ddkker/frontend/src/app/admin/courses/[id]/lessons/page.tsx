import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 0;
export const metadata = { title: "수업 관리" };

interface PageProps {
  params: { id: string };
}

// ── Server Actions ──────────────────────────────────────────────
async function createLesson(courseId: number, formData: FormData) {
  "use server";
  await requireAdmin();
  const title = (formData.get("title") as string)?.trim();
  if (!title) return;
  const duration = parseInt((formData.get("duration_min") as string) ?? "", 10);
  const sort = parseInt((formData.get("sort_order") as string) ?? "", 10);
  const videoUrl = (formData.get("video_url") as string)?.trim();
  const tier = (formData.get("tier") as string) || "premium";

  await adminClient.from("lessons").insert({
    course_id: courseId,
    title,
    duration_min: Number.isFinite(duration) ? duration : null,
    sort_order: Number.isFinite(sort) ? sort : 0,
    tier,
    video_url: videoUrl || null,
    published: true,
  });
  await adminClient.rpc("log_admin_action", {
    p_action: "lesson_created",
    p_table: "lessons",
    p_meta: { course_id: courseId, title },
  });
  revalidatePath(`/admin/courses/${courseId}/lessons`);
}

async function updateLesson(lessonId: number, courseId: number, formData: FormData) {
  "use server";
  await requireAdmin();
  const title = (formData.get("title") as string)?.trim();
  if (!title) return;
  const duration = parseInt((formData.get("duration_min") as string) ?? "", 10);
  const sort = parseInt((formData.get("sort_order") as string) ?? "", 10);
  const videoUrl = (formData.get("video_url") as string)?.trim();
  const tier = (formData.get("tier") as string) || "premium";

  await adminClient
    .from("lessons")
    .update({
      title,
      duration_min: Number.isFinite(duration) ? duration : null,
      sort_order: Number.isFinite(sort) ? sort : 0,
      tier,
      video_url: videoUrl || null,
    })
    .eq("id", lessonId);
  revalidatePath(`/admin/courses/${courseId}/lessons`);
}

async function toggleLessonPublished(
  lessonId: number,
  courseId: number,
  current: boolean
) {
  "use server";
  await requireAdmin();
  await adminClient
    .from("lessons")
    .update({ published: !current })
    .eq("id", lessonId);
  revalidatePath(`/admin/courses/${courseId}/lessons`);
}

async function deleteLesson(lessonId: number, courseId: number) {
  "use server";
  await requireAdmin();
  await adminClient.from("lessons").delete().eq("id", lessonId);
  await adminClient.rpc("log_admin_action", {
    p_action: "lesson_deleted",
    p_table: "lessons",
    p_target_id: String(lessonId),
  });
  revalidatePath(`/admin/courses/${courseId}/lessons`);
}

// ── Page ────────────────────────────────────────────────────────
export default async function AdminLessonsPage({ params }: PageProps) {
  await requireAdmin();
  const courseId = Number(params.id);
  if (!Number.isFinite(courseId)) notFound();

  const { data: course } = await adminClient
    .from("courses")
    .select("id, title, slug")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) notFound();

  const { data: lessons } = await adminClient
    .from("lessons")
    .select("id, title, sort_order, duration_min, tier, video_url, published")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  const inputCls =
    "px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted mb-2">
        <Link href="/admin/courses" className="hover:text-primary">강의 관리</Link>
        <span>/</span>
        <span className="text-ink">{course.title}</span>
      </div>
      <h1 className="text-display-md font-serif text-ink mb-1">수업 관리</h1>
      <p className="text-sm text-muted mb-8">
        영상 URL을 입력하면 활성화(시청 가능), 비우면 “준비중”으로 표시됩니다.
      </p>

      {/* 새 수업 추가 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6 mb-8">
        <h2 className="text-title-md font-semibold text-ink mb-4">새 수업 추가</h2>
        <form action={createLesson.bind(null, courseId)} className="grid md:grid-cols-6 gap-3">
          <input name="sort_order" type="number" placeholder="순서" className={`${inputCls} md:col-span-1`} defaultValue={(lessons?.length ?? 0) + 1} />
          <input name="title" type="text" required placeholder="수업 제목 *" className={`${inputCls} md:col-span-3`} />
          <input name="duration_min" type="number" placeholder="분" className={`${inputCls} md:col-span-1`} />
          <select name="tier" className={`${inputCls} md:col-span-1`} defaultValue="premium">
            <option value="premium">프리미엄</option>
            <option value="free">무료</option>
          </select>
          <input name="video_url" type="text" placeholder="영상 URL/ID (비우면 준비중)" className={`${inputCls} md:col-span-5`} />
          <button type="submit" className="md:col-span-1 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-active transition-colors">
            추가
          </button>
        </form>
      </section>

      {/* 수업 목록 (인라인 편집) */}
      <section className="bg-canvas border border-hairline rounded-xl p-6">
        <h2 className="text-title-md font-semibold text-ink mb-4">
          수업 목록 ({lessons?.length ?? 0})
        </h2>
        <div className="flex flex-col gap-3">
          {(lessons ?? []).map((l) => (
            <div key={l.id} className="border border-hairline rounded-lg p-4">
              <form action={updateLesson.bind(null, l.id, courseId)} className="grid md:grid-cols-6 gap-3 items-center">
                <input name="sort_order" type="number" defaultValue={l.sort_order} className={`${inputCls} md:col-span-1`} />
                <input name="title" type="text" defaultValue={l.title} className={`${inputCls} md:col-span-3`} />
                <input name="duration_min" type="number" defaultValue={l.duration_min ?? ""} placeholder="분" className={`${inputCls} md:col-span-1`} />
                <select name="tier" defaultValue={l.tier} className={`${inputCls} md:col-span-1`}>
                  <option value="premium">프리미엄</option>
                  <option value="free">무료</option>
                </select>
                <input name="video_url" type="text" defaultValue={l.video_url ?? ""} placeholder="영상 URL/ID (비우면 준비중)" className={`${inputCls} md:col-span-4`} />
                <div className="md:col-span-2 flex items-center gap-2 justify-end">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-pill ${l.video_url ? "bg-success/10 text-success" : "bg-surface-card text-muted"}`}>
                    {l.video_url ? "활성" : "준비중"}
                  </span>
                  <button type="submit" className="px-3 py-1.5 bg-ink text-white text-xs font-semibold rounded-md hover:opacity-90">
                    저장
                  </button>
                </div>
              </form>
              <div className="flex items-center gap-2 mt-2 justify-end">
                <form action={toggleLessonPublished.bind(null, l.id, courseId, l.published)}>
                  <button type="submit" className={`px-3 py-1 rounded-pill text-xs font-semibold ${l.published ? "bg-success/10 text-success" : "bg-surface-card text-muted"}`}>
                    {l.published ? "공개" : "비공개"}
                  </button>
                </form>
                <form action={deleteLesson.bind(null, l.id, courseId)}>
                  <button type="submit" className="px-3 py-1 rounded-pill text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100">
                    삭제
                  </button>
                </form>
              </div>
            </div>
          ))}
          {(!lessons || lessons.length === 0) && (
            <p className="text-sm text-muted py-6 text-center">아직 수업이 없습니다. 위에서 추가하세요.</p>
          )}
        </div>
      </section>
    </div>
  );
}
