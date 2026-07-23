"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface CommentFormProps {
  postId: number;
  onSuccess?: () => void;
}

export function CommentForm({ postId, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "댓글 등록에 실패했습니다.");
        return;
      }

      setContent("");
      onSuccess?.();
      // 페이지 새로고침으로 최신 댓글 반영
      window.location.reload();
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 입력하세요..."
        className="w-full px-4 py-3 border border-hairline rounded-xl bg-canvas text-ink placeholder:text-muted text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        rows={3}
        maxLength={2000}
        disabled={isLoading}
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          {content.length}/2000
        </span>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading || !content.trim()}
        >
          {isLoading ? "등록 중..." : "댓글 등록"}
        </Button>
      </div>
    </form>
  );
}
