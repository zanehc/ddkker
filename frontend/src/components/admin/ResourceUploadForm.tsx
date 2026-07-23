"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CreateResult = { ok: boolean; error?: string };

/**
 * 관리자 자료 업로드 폼 (게시판형).
 * 1) /api/admin/resources/upload-url 에서 presigned PUT URL 발급
 * 2) 브라우저에서 R2로 직접 PUT 업로드 (Vercel 서버액션 4.5MB 한계 우회)
 * 3) createAction(서버액션)으로 메타데이터(file_key 포함) 저장
 */
export function ResourceUploadForm({
  createAction,
}: {
  createAction: (formData: FormData) => Promise<CreateResult>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);

    const title = (fd.get("title") as string)?.trim();
    if (!title) {
      setError("제목을 입력하세요.");
      return;
    }
    const file = fileRef.current?.files?.[0] ?? null;
    if (!file) {
      setError("업로드할 파일을 선택하세요.");
      return;
    }

    setBusy(true);
    try {
      const contentType = file.type || "application/octet-stream";

      // 1) presigned PUT URL 발급
      setProgress("업로드 준비 중…");
      const urlRes = await fetch("/api/admin/resources/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType }),
      });
      if (!urlRes.ok) {
        const j = await urlRes.json().catch(() => ({}));
        throw new Error(j.error ?? "업로드 URL 발급 실패");
      }
      const { url, key } = (await urlRes.json()) as { url: string; key: string };

      // 2) R2로 직접 업로드
      setProgress("파일 업로드 중…");
      const putRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      });
      if (!putRes.ok) {
        throw new Error(`파일 업로드 실패 (${putRes.status})`);
      }

      // 3) 메타데이터 저장
      setProgress("자료 등록 중…");
      const ext = file.name.includes(".")
        ? file.name.split(".").pop()!.toLowerCase()
        : "";
      fd.set("file_key", key);
      fd.set("file_type", ext);
      fd.set("file_size_bytes", String(file.size));

      const result = await createAction(fd);
      if (!result.ok) {
        throw new Error(result.error ?? "자료 등록 실패");
      }

      form.reset();
      setProgress("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-muted mb-1">파일 *</label>
        <input
          ref={fileRef}
          name="file"
          type="file"
          required
          className="w-full text-sm text-ink file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-sm file:font-semibold hover:file:bg-primary-active"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted mb-1">제목 *</label>
        <input
          name="title"
          type="text"
          required
          className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="자료 제목"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted mb-1">카테고리</label>
        <select
          name="category"
          className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none"
        >
          <option value="">선택 안함</option>
          <option value="code-template">코드 템플릿</option>
          <option value="lecture-material">강의 자료</option>
          <option value="install-guide">설치 가이드</option>
          <option value="source-code">소스코드</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-muted mb-1">설명</label>
        <textarea
          name="description"
          rows={2}
          className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="자료 설명"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted mb-1">티어</label>
        <select
          name="tier"
          className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none"
        >
          <option value="free">무료 (모든 회원)</option>
          <option value="premium">프리미엄 (프리미엄회원만)</option>
        </select>
      </div>
      <div className="flex items-center gap-2 pt-6">
        <input
          id="publish-now"
          name="published"
          type="checkbox"
          defaultChecked
          value="on"
          className="w-4 h-4 accent-primary"
        />
        <label htmlFor="publish-now" className="text-sm text-ink">
          바로 공개
        </label>
      </div>

      <div className="md:col-span-2 flex items-center justify-between">
        <div className="text-sm">
          {error && <span className="text-red-600">{error}</span>}
          {!error && progress && <span className="text-muted">{progress}</span>}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "업로드 중…" : "자료 업로드"}
        </button>
      </div>
    </form>
  );
}
