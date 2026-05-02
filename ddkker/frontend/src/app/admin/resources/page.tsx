import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { revalidatePath } from "next/cache";

export const revalidate = 0;

export const metadata = { title: "자료 관리" };

async function createResource(formData: FormData) {
  "use server";
  await requireAdmin();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const fileKey = formData.get("file_key") as string;
  const fileType = formData.get("file_type") as string;
  const tier = formData.get("tier") as string;

  if (!title?.trim()) return;

  const { error } = await adminClient.from("resources").insert({
    title: title.trim(),
    description: description?.trim() || null,
    category: category || null,
    file_key: fileKey?.trim() || null,
    file_type: fileType?.trim() || null,
    tier: tier || "free",
    published: false,
  });

  if (!error) {
    await adminClient.rpc("log_admin_action", {
      p_action: "resource_created",
      p_table: "resources",
      p_meta: { title },
    });
    revalidatePath("/admin/resources");
  }
}

async function toggleResourcePublished(resourceId: number, currentValue: boolean) {
  "use server";
  await requireAdmin();
  await adminClient
    .from("resources")
    .update({ published: !currentValue, updated_at: new Date().toISOString() })
    .eq("id", resourceId);
  await adminClient.rpc("log_admin_action", {
    p_action: currentValue ? "resource_unpublished" : "resource_published",
    p_table: "resources",
    p_target_id: String(resourceId),
  });
  revalidatePath("/admin/resources");
}

export default async function AdminResourcesPage() {
  await requireAdmin();

  const { data: resources } = await adminClient
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-display-md font-serif text-ink mb-8">자료 관리</h1>

      {/* 자료 등록 폼 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6 mb-8">
        <h2 className="text-title-md font-semibold text-ink mb-4">새 자료 등록</h2>
        <form action={createResource} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">제목 *</label>
            <input name="title" type="text" required
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="자료 제목" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">R2 오브젝트 키</label>
            <input name="file_key" type="text"
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink font-mono bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="files/example.zip" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted mb-1">설명</label>
            <textarea name="description" rows={2}
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="자료 설명" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">카테고리</label>
            <select name="category"
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none">
              <option value="">선택 안함</option>
              <option value="code-template">코드 템플릿</option>
              <option value="lecture-material">강의 자료</option>
              <option value="install-guide">설치 가이드</option>
              <option value="source-code">소스코드</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">파일 유형</label>
            <input name="file_type" type="text"
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink font-mono bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="zip, pdf, md ..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">티어</label>
            <select name="tier"
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none">
              <option value="free">무료</option>
              <option value="premium">프리미엄</option>
            </select>
          </div>
          <div className="flex items-end justify-end">
            <button type="submit"
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-active transition-colors">
              자료 등록
            </button>
          </div>
        </form>
      </section>

      {/* 자료 목록 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6">
        <h2 className="text-title-md font-semibold text-ink mb-4">
          자료 목록 ({resources?.length ?? 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-muted">
                <th className="pb-3 pr-4">제목</th>
                <th className="pb-3 pr-4">R2 키</th>
                <th className="pb-3 pr-4">카테고리</th>
                <th className="pb-3 pr-4">티어</th>
                <th className="pb-3 pr-4">다운로드</th>
                <th className="pb-3">공개</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {(resources ?? []).map((resource) => (
                <tr key={resource.id}>
                  <td className="py-3 pr-4 font-medium text-ink max-w-[200px] truncate">
                    {resource.title}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-muted max-w-[160px] truncate">
                    {resource.file_key ?? "-"}
                  </td>
                  <td className="py-3 pr-4 text-muted">{resource.category ?? "-"}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-pill text-xs font-semibold uppercase ${
                      resource.tier === "free" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                    }`}>
                      {resource.tier === "free" ? "무료" : "프리미엄"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    {resource.download_count.toLocaleString()}
                  </td>
                  <td className="py-3">
                    <form action={toggleResourcePublished.bind(null, resource.id, resource.published)}>
                      <button type="submit"
                        className={`px-3 py-1 rounded-pill text-xs font-semibold transition-colors ${
                          resource.published
                            ? "bg-success/10 text-success hover:bg-red-100 hover:text-red-600"
                            : "bg-surface-card text-muted hover:bg-success/10 hover:text-success"
                        }`}>
                        {resource.published ? "공개" : "비공개"}
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
