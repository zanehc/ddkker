"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type BoardType = "qa" | "review" | "project";

const BOARD_LABELS: Record<BoardType, string> = {
  qa: "Q&A",
  review: "수강 후기",
  project: "프로젝트",
};

export default function NewPostPage() {
  const router = useRouter();
  const [board, setBoard] = useState<BoardType>("qa");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board, title, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        setError(data.error ?? "게시글 등록에 실패했습니다.");
        return;
      }

      router.push(`/community/${data.id}`);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[800px] mx-auto px-6 py-16">
        {/* 헤더 */}
        <div className="mb-8">
          <a
            href="/community"
            className="text-sm text-muted hover:text-primary transition-colors mb-4 inline-block"
          >
            ← 커뮤니티로 돌아가기
          </a>
          <h1 className="text-display-md font-bold text-ink">
            글쓰기
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 게시판 선택 */}
          <div>
            <label className="block text-sm font-medium text-ink mb-3">
              게시판
            </label>
            <div className="flex gap-3">
              {(Object.keys(BOARD_LABELS) as BoardType[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBoard(b)}
                  className={`px-4 py-2 rounded-pill text-sm font-medium border transition-colors ${
                    board === b
                      ? "bg-primary text-white border-primary"
                      : "bg-canvas text-muted border-hairline hover:border-primary/40 hover:text-ink"
                  }`}
                >
                  {BOARD_LABELS[b]}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-ink mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full px-4 py-3 border border-hairline rounded-xl bg-canvas text-ink placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              maxLength={200}
              required
            />
            <p className="text-xs text-muted mt-1 text-right">
              {title.length}/200
            </p>
          </div>

          {/* 내용 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-ink mb-2">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요..."
              className="w-full px-4 py-3 border border-hairline rounded-xl bg-canvas text-ink placeholder:text-muted text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              rows={10}
              maxLength={10000}
              required
            />
            <p className="text-xs text-muted mt-1 text-right">
              {content.length}/10000
            </p>
          </div>

          {/* 오류 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !title.trim() || !content.trim()}
            >
              {isLoading ? "등록 중..." : "게시글 등록"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
