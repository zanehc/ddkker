import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { revalidatePath } from "next/cache";

export const revalidate = 0;

export const metadata = { title: "강의 관리" };

// Server Actions
async function togglePublished(courseId: number, currentValue: boolean) {
  "use server";
  await requireAdmin();
  await adminClient
    .from("courses")
    .update({ published: !currentValue, updated_at: new Date().toISOString() })
    .eq("id", courseId);
  await adminClient.rpc("log_admin_action", {
    p_action: currentValue ? "course_unpublished" : "course_published",
    p_table: "courses",
    p_target_id: String(courseId),
  });
  revalidatePath("/admin/courses");
}

async function createCourse(formData: FormData) {
  "use server";
  await requireAdmin();

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const difficulty = formData.get("difficulty") as string;
  const tier = formData.get("tier") as string;
  const sortOrder = parseInt(formData.get("sort_order") as string || "0", 10);

  if (!title?.trim() || !slug?.trim()) return;

  const { error } = await adminClient.from("courses").insert({
    title: title.trim(),
    slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
    description: description?.trim() || null,
    category: category || null,
    difficulty: difficulty || null,
    tier: tier || "free",
    sort_order: sortOrder,
    published: false,
  });

  if (!error) {
    await adminClient.rpc("log_admin_action", {
      p_action: "course_created",
      p_table: "courses",
      p_meta: { title },
    });
    revalidatePath("/admin/courses");
  }
}

export default async function AdminCoursesPage() {
  await requireAdmin();

  const { data: courses } = await adminClient
    .from("courses")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="text-display-md font-serif text-ink mb-8">강의 관리</h1>

      {/* 강의 등록 폼 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6 mb-8">
        <h2 className="text-title-md font-semibold text-ink mb-4">새 강의 등록</h2>
        <form action={createCourse} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">제목 *</label>
            <input name="title" type="text" required
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="강의 제목" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">슬러그 *</label>
            <input name="slug" type="text" required
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink font-mono bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="vibe-coding-setup" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted mb-1">설명</label>
            <textarea name="description" rows={2}
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="강의 설명" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">카테고리</label>
            <select name="category"
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none">
              <option value="">선택 안함</option>
              <option value="vibe-coding">바이브코딩</option>
              <option value="autobot">자동화봇</option>
              <option value="saas-infra">SaaS 인프라</option>
              <option value="google-auth">구글 인증</option>
              <option value="claude-cli">Claude CLI</option>
              <option value="codex-cli">Codex CLI</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">난이도</label>
            <select name="difficulty"
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none">
              <option value="">선택 안함</option>
              <option value="beginner">입문</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">티어</label>
            <select name="tier"
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none">
              <option value="free">무료</option>
              <option value="premium">프리미엄</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">정렬 순서</label>
            <input name="sort_order" type="number" defaultValue={0}
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit"
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-active transition-colors">
              강의 등록
            </button>
          </div>
        </form>
      </section>

      {/* 강의 목록 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6">
        <h2 className="text-title-md font-semibold text-ink mb-4">
          강의 목록 ({courses?.length ?? 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-muted">
                <th className="pb-3 pr-4">제목</th>
                <th className="pb-3 pr-4">슬러그</th>
                <th className="pb-3 pr-4">카테고리</th>
                <th className="pb-3 pr-4">티어</th>
                <th className="pb-3 pr-4">정렬</th>
                <th className="pb-3">공개</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {(courses ?? []).map((course) => (
                <tr key={course.id}>
                  <td className="py-3 pr-4 font-medium text-ink">{course.title}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-muted">{course.slug}</td>
                  <td className="py-3 pr-4 text-muted">{course.category ?? "-"}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-pill text-xs font-semibold uppercase ${
                      course.tier === "free" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                    }`}>
                      {course.tier === "free" ? "무료" : "프리미엄"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted">{course.sort_order}</td>
                  <td className="py-3">
                    <form action={togglePublished.bind(null, course.id, course.published)}>
                      <button type="submit"
                        className={`px-3 py-1 rounded-pill text-xs font-semibold transition-colors ${
                          course.published
                            ? "bg-success/10 text-success hover:bg-red-100 hover:text-red-600"
                            : "bg-surface-card text-muted hover:bg-success/10 hover:text-success"
                        }`}>
                        {course.published ? "공개" : "비공개"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
