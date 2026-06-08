import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { deleteR2Object } from "@/lib/server/r2";
import { revalidatePath } from "next/cache";
import { ResourceUploadForm } from "@/components/admin/ResourceUploadForm";

export const revalidate = 0;

export const metadata = { title: "자료 관리" };

type CreateResult = { ok: boolean; error?: string };

/**
 * 업로드된 파일의 메타데이터를 저장한다.
 * 실제 파일은 클라이언트에서 R2로 직접 업로드된 뒤 file_key 로 전달된다.
 */
async function createResource(formData: FormData): Promise<CreateResult> {
  "use server";
  await requireAdmin();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const category = formData.get("category") as string;
  const fileKey = (formData.get("file_key") as string)?.trim();
  const fileType = (formData.get("file_type") as string)?.trim();
  const fileSize = parseInt((formData.get("file_size_bytes") as string) ?? "", 10);
  const tier = (formData.get("tier") as string) || "free";
  const published = formData.get("published") === "on";

  if (!title) return { ok: false, error: "제목이 필요합니다." };
  if (!fileKey) return { ok: false, error: "파일 업로드가 완료되지 않았습니다." };

  const { error } = await adminClient.from("resources").insert({
    title,
    description: description || null,
    category: category || null,
    file_key: fileKey,
    file_type: fileType || null,
    file_size_bytes: Number.isFinite(fileSize) ? fileSize : null,
    tier,
    published,
  });

  if (error) return { ok: false, error: error.message };

  await adminClient.rpc("log_admin_action", {
    p_action: "resource_created",
    p_table: "resources",
    p_meta: { title },
  });
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  return { ok: true };
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
  revalidatePath("/resources");
}

async function deleteResource(resourceId: number) {
  "use server";
  await requireAdmin();

  // 원본 파일 키 조회 후 R2 오브젝트도 정리
  const { data: resource } = await adminClient
    .from("resources")
    .select("file_key, title")
    .eq("id", resourceId)
    .single();

  await adminClient.from("resources").delete().eq("id", resourceId);

  if (resource?.file_key) {
    try {
      await deleteR2Object(resource.file_key);
    } catch {
      // R2 삭제 실패는 치명적이지 않음 (DB 레코드는 이미 제거됨)
    }
  }

  await adminClient.rpc("log_admin_action", {
    p_action: "resource_deleted",
    p_table: "resources",
    p_target_id: String(resourceId),
    p_meta: { title: resource?.title },
  });
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)}${units[i]}`;
}

export default async function AdminResourcesPage() {
  await requireAdmin();

  const { data: resources } = await adminClient
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-display-md font-serif text-ink mb-2">자료실 관리</h1>
      <p className="text-sm text-muted mb-8">
        파일을 업로드하면 자료실 게시판에 등록됩니다. 일반 회원은 조회·다운로드만 가능합니다.
      </p>

      {/* 자료 업로드 폼 (실제 파일 업로드 → R2) */}
      <section className="bg-canvas border border-hairline rounded-xl p-6 mb-8">
        <h2 className="text-title-md font-semibold text-ink mb-4">새 자료 업로드</h2>
        <ResourceUploadForm createAction={createResource} />
      </section>

      {/* 자료 목록 (게시판) */}
      <section className="bg-canvas border border-hairline rounded-xl p-6">
        <h2 className="text-title-md font-semibold text-ink mb-4">
          자료 목록 ({resources?.length ?? 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-muted">
                <th className="pb-3 pr-4">제목</th>
                <th className="pb-3 pr-4">카테고리</th>
                <th className="pb-3 pr-4">유형</th>
                <th className="pb-3 pr-4">용량</th>
                <th className="pb-3 pr-4">티어</th>
                <th className="pb-3 pr-4">다운로드</th>
                <th className="pb-3 pr-4">등록일</th>
                <th className="pb-3 pr-4">공개</th>
                <th className="pb-3">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {(resources ?? []).map((resource) => (
                <tr key={resource.id}>
                  <td className="py-3 pr-4 font-medium text-ink max-w-[220px] truncate">
                    {resource.title}
                  </td>
                  <td className="py-3 pr-4 text-muted">{resource.category ?? "-"}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-muted uppercase">
                    {resource.file_type ?? "-"}
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    {formatBytes(resource.file_size_bytes)}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-pill text-xs font-semibold ${
                        resource.tier === "free"
                          ? "bg-success/10 text-success"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {resource.tier === "free" ? "무료" : "프리미엄"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    {resource.download_count.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 text-muted whitespace-nowrap">
                    {new Date(resource.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="py-3 pr-4">
                    <form
                      action={toggleResourcePublished.bind(
                        null,
                        resource.id,
                        resource.published
                      )}
                    >
                      <button
                        type="submit"
                        className={`px-3 py-1 rounded-pill text-xs font-semibold transition-colors ${
                          resource.published
                            ? "bg-success/10 text-success hover:bg-amber-100 hover:text-amber-700"
                            : "bg-surface-card text-muted hover:bg-success/10 hover:text-success"
                        }`}
                      >
                        {resource.published ? "공개" : "비공개"}
                      </button>
                    </form>
                  </td>
                  <td className="py-3">
                    <form action={deleteResource.bind(null, resource.id)}>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-pill text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        삭제
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!resources || resources.length === 0) && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted">
                    등록된 자료가 없습니다. 위에서 파일을 업로드하세요.
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
