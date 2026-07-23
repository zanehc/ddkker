import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { Course } from "@/types";

export const revalidate = 0;

export const metadata = { title: "강의 관리" };

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "vibe-coding", label: "바이브코딩" },
  { value: "autobot", label: "자동화봇" },
  { value: "saas-infra", label: "SaaS 인프라" },
  { value: "google-auth", label: "구글 인증" },
  { value: "claude-cli", label: "Claude CLI" },
  { value: "codex-cli", label: "Codex CLI" },
  { value: "local-ai", label: "로컬AI" },
  { value: "cli-orchestration", label: "CLI 오케스트레이션" },
];

const won = (n: number) => `₩${(n ?? 0).toLocaleString("ko-KR")}`;

// 수강 개월 수 입력 → 양수 또는 null(무기한). 빈칸/0/음수는 무기한으로 본다.
function parseAccessMonths(raw: string | null): number | null {
  const n = parseInt(raw || "", 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// 줄바꿈으로 구분된 텍스트 → 문자열 배열
function parseHighlights(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

// ── Server Actions ──────────────────────────────────────────────
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
  revalidatePath("/premium");
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
  const price = parseInt((formData.get("price") as string) || "0", 10);
  const highlights = parseHighlights((formData.get("highlights") as string) || "");
  const sortOrder = parseInt((formData.get("sort_order") as string) || "0", 10);
  const accessMonths = parseAccessMonths(formData.get("access_months") as string);

  if (!title?.trim() || !slug?.trim()) return;

  const { error } = await adminClient.from("courses").insert({
    title: title.trim(),
    slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
    description: description?.trim() || null,
    category: category || null,
    difficulty: difficulty || null,
    tier: tier || "free",
    price: Number.isFinite(price) ? price : 0,
    highlights,
    access_months: accessMonths,
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
    revalidatePath("/premium");
  }
}

async function updateCourse(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = parseInt(formData.get("id") as string, 10);
  if (!id) return;

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  if (!title?.trim() || !slug?.trim()) return;

  const price = parseInt((formData.get("price") as string) || "0", 10);
  const highlights = parseHighlights((formData.get("highlights") as string) || "");
  const sortOrder = parseInt((formData.get("sort_order") as string) || "0", 10);
  const accessMonths = parseAccessMonths(formData.get("access_months") as string);

  const { error } = await adminClient
    .from("courses")
    .update({
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      description: (formData.get("description") as string)?.trim() || null,
      category: (formData.get("category") as string) || null,
      difficulty: (formData.get("difficulty") as string) || null,
      tier: (formData.get("tier") as string) || "free",
      price: Number.isFinite(price) ? price : 0,
      highlights,
      access_months: accessMonths,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (!error) {
    await adminClient.rpc("log_admin_action", {
      p_action: "course_updated",
      p_table: "courses",
      p_target_id: String(id),
      p_meta: { title },
    });
    revalidatePath("/admin/courses");
    revalidatePath("/premium");
  }
}

const inputCls =
  "w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20";

export default async function AdminCoursesPage() {
  await requireAdmin();

  const { data } = await adminClient
    .from("courses")
    .select("*")
    .order("sort_order", { ascending: true });
  const courses = (data ?? []) as Course[];

  return (
    <div>
      <h1 className="text-display-md font-serif text-ink mb-8">강의 관리</h1>

      {/* 강의 등록 폼 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6 mb-8">
        <h2 className="text-title-md font-semibold text-ink mb-4">새 강의 등록</h2>
        <form action={createCourse} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">제목 *</label>
            <input name="title" type="text" required className={inputCls} placeholder="강의 제목" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">슬러그 *</label>
            <input name="slug" type="text" required className={`${inputCls} font-mono`} placeholder="vibe-coding-setup" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted mb-1">설명 (한 줄 소개)</label>
            <textarea name="description" rows={2} className={`${inputCls} resize-none`} placeholder="강의 한 줄 소개" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted mb-1">
              커리큘럼 하이라이트 (한 줄에 하나씩 — 프리미엄 카드 불릿)
            </label>
            <textarea name="highlights" rows={4} className={`${inputCls} resize-none`} placeholder={"멀티 에이전트 오케스트레이션\n로컬AI 스택 구축\n소스코드 · 12개월 수강 포함"} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">카테고리</label>
            <select name="category" className={inputCls} defaultValue="">
              <option value="">선택 안함</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">난이도</label>
            <select name="difficulty" className={inputCls} defaultValue="">
              <option value="">선택 안함</option>
              <option value="beginner">입문</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">티어</label>
            <select name="tier" className={inputCls} defaultValue="free">
              <option value="free">무료</option>
              <option value="premium">프리미엄</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">가격 (원, 0=무료)</label>
            <input name="price" type="number" min={0} step={1000} defaultValue={0} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">수강 기간 (개월, 비우면 무기한)</label>
            <input name="access_months" type="number" min={1} step={1} defaultValue={12} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">정렬 순서</label>
            <input name="sort_order" type="number" defaultValue={0} className={inputCls} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-active transition-colors">
              강의 등록
            </button>
          </div>
        </form>
      </section>

      {/* 강의 목록 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6">
        <h2 className="text-title-md font-semibold text-ink mb-4">
          강의 목록 ({courses.length})
        </h2>
        <div className="space-y-3">
          {courses.map((course) => (
            <details key={course.id} className="group border border-hairline rounded-lg">
              <summary className="flex items-center gap-4 px-4 py-3 cursor-pointer list-none hover:bg-surface-soft transition-colors rounded-lg">
                <span className="font-medium text-ink flex-1 min-w-0 truncate">{course.title}</span>
                <span className="font-mono text-xs text-muted hidden sm:inline truncate max-w-[160px]">{course.slug}</span>
                <span className={`px-2 py-0.5 rounded-pill text-xs font-semibold uppercase ${
                  course.tier === "free" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                }`}>
                  {course.tier === "free" ? "무료" : "프리미엄"}
                </span>
                <span className="text-sm text-ink tabular-nums w-20 text-right">{won(course.price)}</span>
                <form action={togglePublished.bind(null, course.id, course.published)}>
                  <button type="submit" className={`px-3 py-1 rounded-pill text-xs font-semibold transition-colors ${
                    course.published
                      ? "bg-success/10 text-success hover:bg-red-100 hover:text-red-600"
                      : "bg-surface-card text-muted hover:bg-success/10 hover:text-success"
                  }`}>
                    {course.published ? "공개" : "비공개"}
                  </button>
                </form>
                <span className="text-muted text-xs group-open:rotate-180 transition-transform">▾</span>
              </summary>

              {/* 편집 폼 */}
              <form action={updateCourse} className="grid md:grid-cols-2 gap-4 p-4 border-t border-hairline-soft bg-surface-soft/40">
                <input type="hidden" name="id" value={course.id} />
                <div className="md:col-span-2 flex justify-end -mb-1">
                  <Link
                    href={`/admin/courses/${course.id}/lessons`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    📚 이 강의의 수업 관리 →
                  </Link>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">제목 *</label>
                  <input name="title" type="text" required defaultValue={course.title} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">슬러그 *</label>
                  <input name="slug" type="text" required defaultValue={course.slug} className={`${inputCls} font-mono`} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-muted mb-1">설명 (한 줄 소개)</label>
                  <textarea name="description" rows={2} defaultValue={course.description ?? ""} className={`${inputCls} resize-none`} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-muted mb-1">커리큘럼 하이라이트 (한 줄에 하나씩)</label>
                  <textarea name="highlights" rows={5} defaultValue={(course.highlights ?? []).join("\n")} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">카테고리</label>
                  <select name="category" className={inputCls} defaultValue={course.category ?? ""}>
                    <option value="">선택 안함</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">난이도</label>
                  <select name="difficulty" className={inputCls} defaultValue={course.difficulty ?? ""}>
                    <option value="">선택 안함</option>
                    <option value="beginner">입문</option>
                    <option value="intermediate">중급</option>
                    <option value="advanced">고급</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">티어</label>
                  <select name="tier" className={inputCls} defaultValue={course.tier}>
                    <option value="free">무료</option>
                    <option value="premium">프리미엄</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">가격 (원, 0=무료)</label>
                  <input name="price" type="number" min={0} step={1000} defaultValue={course.price ?? 0} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">수강 기간 (개월, 비우면 무기한)</label>
                  <input name="access_months" type="number" min={1} step={1} defaultValue={course.access_months ?? ""} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">정렬 순서</label>
                  <input name="sort_order" type="number" defaultValue={course.sort_order} className={inputCls} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button type="submit" className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-active transition-colors">
                    변경 저장
                  </button>
                </div>
              </form>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
