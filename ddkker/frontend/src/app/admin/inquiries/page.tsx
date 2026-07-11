import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  PROJECT_TYPE_LABELS,
  BUDGET_RANGE_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  SOURCES,
  STATUSES,
} from "@/lib/inquiry";
import type { ProjectInquiry, InquiryStatus } from "@/types";

export const revalidate = 0;

export const metadata = { title: "외주 의뢰 관리" };

const dateFmt = (s: string) =>
  new Date(s).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// 상태별 뱃지 색상
const STATUS_STYLE: Record<InquiryStatus, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-accent-amber/15 text-accent-amber",
  quoted: "bg-accent-amber/15 text-accent-amber",
  contracted: "bg-success/10 text-success",
  done: "bg-success/10 text-success",
  dropped: "bg-surface-card text-muted",
};

async function updateInquiry(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = Number(formData.get("id"));
  const status = formData.get("status") as string;
  const source = formData.get("source") as string;
  const adminNote = formData.get("admin_note") as string;

  if (!id || !(STATUSES as string[]).includes(status)) return;

  const patch: Record<string, unknown> = {
    status,
    admin_note: adminNote?.trim() || null,
    updated_at: new Date().toISOString(),
  };
  if (source && (SOURCES as string[]).includes(source)) patch.source = source;

  const { error } = await adminClient
    .from("project_inquiries")
    .update(patch)
    .eq("id", id);

  if (!error) {
    await adminClient.rpc("log_admin_action", {
      p_action: "inquiry_updated",
      p_table: "project_inquiries",
      p_target_id: String(id),
      p_meta: { status, source: patch.source ?? source },
    });
    revalidatePath("/admin/inquiries");
  }
}

type InquiryRow = ProjectInquiry & {
  profiles: { display_name: string | null } | null;
};

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: { source?: string };
}) {
  await requireAdmin();

  const sourceFilter =
    searchParams.source && (SOURCES as string[]).includes(searchParams.source)
      ? searchParams.source
      : null;

  let query = adminClient
    .from("project_inquiries")
    .select("*, profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (sourceFilter) query = query.eq("source", sourceFilter);

  const { data } = await query;
  const inquiries = (data ?? []) as unknown as InquiryRow[];

  const newCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-display-md font-serif text-ink">외주 의뢰 관리</h1>
        <span className="text-sm text-muted">
          미처리 <span className="font-semibold text-primary">{newCount}</span>건 · 전체 {inquiries.length}건
        </span>
      </div>

      {/* 유입경로 필터 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/admin/inquiries"
          className={`px-3 py-1.5 rounded-pill text-xs font-medium border transition-colors ${
            !sourceFilter
              ? "bg-primary text-white border-primary"
              : "bg-canvas text-muted border-hairline hover:border-primary/40"
          }`}
        >
          전체
        </Link>
        {SOURCES.map((s) => (
          <Link
            key={s}
            href={`/admin/inquiries?source=${s}`}
            className={`px-3 py-1.5 rounded-pill text-xs font-medium border transition-colors ${
              sourceFilter === s
                ? "bg-primary text-white border-primary"
                : "bg-canvas text-muted border-hairline hover:border-primary/40"
            }`}
          >
            {SOURCE_LABELS[s]}
          </Link>
        ))}
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-xl p-12 text-center">
          <p className="text-muted text-sm">아직 접수된 의뢰가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <article
              key={inq.id}
              className="bg-canvas border border-hairline rounded-xl p-6"
            >
              {/* 헤더 */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-pill text-[11px] font-semibold ${STATUS_STYLE[inq.status]}`}
                    >
                      {STATUS_LABELS[inq.status]}
                    </span>
                    <span className="px-2 py-0.5 rounded-pill text-[11px] font-medium bg-surface-card text-muted">
                      {SOURCE_LABELS[inq.source]}
                    </span>
                    <span className="text-xs text-muted">{dateFmt(inq.created_at)}</span>
                  </div>
                  <h2 className="text-title-md font-semibold text-ink truncate">{inq.title}</h2>
                </div>
              </div>

              {/* 메타 */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1 text-xs text-muted mb-3">
                <span>유형: <span className="text-ink">{PROJECT_TYPE_LABELS[inq.project_type]}</span></span>
                <span>예산: <span className="text-ink">{inq.budget_range ? BUDGET_RANGE_LABELS[inq.budget_range] : "미정"}</span></span>
                <span>일정: <span className="text-ink">{inq.timeline || "-"}</span></span>
                <span>가입자: <span className="text-ink">{inq.profiles?.display_name ?? "-"}</span></span>
                <span>이름: <span className="text-ink">{inq.contact_name}</span></span>
                <span>이메일: <a href={`mailto:${inq.contact_email}`} className="text-primary hover:underline">{inq.contact_email}</a></span>
                <span>연락처: <span className="text-ink">{inq.contact_phone || "-"}</span></span>
              </div>

              {/* 상세 */}
              <div className="bg-surface-soft rounded-lg p-4 mb-4">
                <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{inq.description}</p>
              </div>

              {/* 관리 폼 */}
              <form action={updateInquiry} className="grid md:grid-cols-[160px_160px_1fr_auto] gap-3 items-end">
                <input type="hidden" name="id" value={inq.id} />
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">상태</label>
                  <select
                    name="status"
                    defaultValue={inq.status}
                    className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">유입경로 보정</label>
                  <select
                    name="source"
                    defaultValue={inq.source}
                    className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">관리자 메모</label>
                  <input
                    name="admin_note"
                    type="text"
                    defaultValue={inq.admin_note ?? ""}
                    placeholder="상담 메모"
                    className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-active transition-colors h-[38px]"
                >
                  저장
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
