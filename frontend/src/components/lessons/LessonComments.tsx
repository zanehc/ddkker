"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = {
  id: number;
  user_id: string | null;
  parent_id: number | null;
  content: string;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

const SELECT =
  "id, user_id, parent_id, content, created_at, profiles(display_name, avatar_url)";

function timeAgo(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

/**
 * 수업별 댓글/대댓글.
 *  - 읽기는 공개(RLS), 쓰기는 구매자/관리자(can_comment_lesson, RLS가 강제).
 *  - parent_id로 1단계 대댓글을 표현한다.
 */
export function LessonComments({
  lessonId,
  canComment,
  currentUserId,
}: {
  lessonId: number;
  canComment: boolean;
  currentUserId: string | null;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("lesson_comments")
      .select(SELECT)
      .eq("lesson_id", lessonId)
      .order("created_at", { ascending: true });
    setRows((data ?? []) as unknown as Row[]);
    setLoading(false);
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(text: string, parentId: number | null) {
    const body = text.trim();
    if (!body) return;
    if (!currentUserId) {
      setError("로그인이 필요합니다.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: insErr } = await supabase.from("lesson_comments").insert({
      lesson_id: lessonId,
      user_id: currentUserId,
      parent_id: parentId,
      content: body,
    });
    setBusy(false);
    if (insErr) {
      setError(
        insErr.code === "42501"
          ? "이 강의를 구매한 회원만 댓글을 작성할 수 있습니다."
          : "댓글 등록에 실패했습니다."
      );
      return;
    }
    setContent("");
    setReplyText("");
    setReplyTo(null);
    await load();
  }

  async function remove(id: number) {
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("lesson_comments")
      .delete()
      .eq("id", id);
    if (!delErr) await load();
  }

  const topLevel = rows.filter((r) => r.parent_id === null);
  const repliesOf = (id: number) => rows.filter((r) => r.parent_id === id);

  const Comment = ({ c, isReply }: { c: Row; isReply?: boolean }) => (
    <div className={isReply ? "pl-10" : ""}>
      <div className="flex items-start gap-3 py-3">
        <div className="w-8 h-8 rounded-full bg-surface-soft border border-hairline overflow-hidden flex items-center justify-center shrink-0">
          {c.profiles?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.profiles.avatar_url}
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-muted">
              {(c.profiles?.display_name || "U")[0]}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">
              {c.profiles?.display_name || "사용자"}
            </span>
            <span className="text-xs text-muted">{timeAgo(c.created_at)}</span>
          </div>
          <p className="text-sm text-body mt-0.5 whitespace-pre-wrap break-words">
            {c.content}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {!isReply && canComment && (
              <button
                onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                className="text-xs text-muted hover:text-ink transition-colors"
              >
                답글
              </button>
            )}
            {currentUserId && c.user_id === currentUserId && (
              <button
                onClick={() => remove(c.id)}
                className="text-xs text-muted hover:text-red-600 transition-colors"
              >
                삭제
              </button>
            )}
          </div>

          {/* 답글 입력 */}
          {replyTo === c.id && (
            <div className="mt-2 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답글을 입력하세요"
                className="flex-1 h-9 px-3 rounded-md border border-hairline bg-canvas text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={() => submit(replyText, c.id)}
                disabled={busy}
                className="h-9 px-3 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-50"
              >
                등록
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-title-md font-semibold text-ink mb-4">
        댓글 <span className="text-muted font-normal">({rows.length})</span>
      </h2>

      {/* 작성 폼 */}
      {canComment ? (
        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="수업에 대한 질문이나 의견을 남겨보세요."
            className="w-full px-3 py-2 rounded-md border border-hairline bg-canvas text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-red-600">{error}</span>
            <button
              onClick={() => submit(content, null)}
              disabled={busy || !content.trim()}
              className="py-2 px-4 rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary-active transition-colors disabled:opacity-50"
            >
              댓글 등록
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted bg-surface-soft border border-hairline rounded-md px-4 py-3">
          이 강의를 구매한 회원만 댓글을 작성할 수 있습니다.
        </p>
      )}

      {/* 목록 */}
      {loading ? (
        <p className="text-sm text-muted py-6 text-center">불러오는 중…</p>
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-muted py-6 text-center">
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
        </p>
      ) : (
        <div className="divide-y divide-hairline">
          {topLevel.map((c) => (
            <div key={c.id}>
              <Comment c={c} />
              {repliesOf(c.id).map((r) => (
                <Comment key={r.id} c={r} isReply />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
