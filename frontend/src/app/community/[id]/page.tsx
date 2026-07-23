import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/server/admin-client";
import { CommentForm } from "@/components/community/CommentForm";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Comment, Post } from "@/types";
import type { Metadata } from "next";

interface PageProps {
  params: { id: string };
}

type PostWithProfile = Post & {
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

type CommentWithProfile = Comment & {
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

const BOARD_LABELS: Record<string, string> = {
  qa: "Q&A",
  review: "수강 후기",
  project: "프로젝트",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("title")
    .eq("id", params.id)
    .eq("is_hidden", false)
    .single();

  if (!data) return { title: "게시글을 찾을 수 없습니다" };
  return { title: data.title };
}

export default async function PostDetailPage({ params }: PageProps) {
  const supabase = createClient();
  const postId = parseInt(params.id, 10);

  if (isNaN(postId)) notFound();

  // 조회수 증가 (원자적 RPC)
  await adminClient.rpc("increment_post_views", { p_post_id: postId });

  // 게시글 조회
  const { data: postData } = await supabase
    .from("posts")
    .select("*, profiles(display_name, avatar_url)")
    .eq("id", postId)
    .eq("is_hidden", false)
    .single();

  if (!postData) notFound();

  const post = postData as unknown as PostWithProfile;

  // 댓글 조회
  const { data: commentsData } = await supabase
    .from("comments")
    .select("*, profiles(display_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const comments: CommentWithProfile[] = (commentsData ?? []) as unknown as CommentWithProfile[];

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[800px] mx-auto px-6 py-16">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/community" className="hover:text-primary transition-colors">
            커뮤니티
          </Link>
          <span>/</span>
          <span className={`px-2 py-0.5 text-xs font-semibold uppercase rounded ${
            post.board === "qa"
              ? "bg-primary/10 text-primary"
              : post.board === "review"
              ? "bg-success/10 text-success"
              : "bg-accent-amber/20 text-amber-700"
          }`}>
            {BOARD_LABELS[post.board] ?? post.board}
          </span>
        </div>

        {/* 게시글 헤더 */}
        <div className="mb-8">
          <h1 className="text-display-sm font-bold text-ink mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span>{post.profiles?.display_name ?? "익명"}</span>
            <span>{new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
            <span>조회 {post.views.toLocaleString()}</span>
          </div>
        </div>

        {/* 게시글 내용 */}
        <div className="border-t border-b border-hairline py-8 mb-8">
          <div className="text-body leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* 댓글 섹션 */}
        <section>
          <h2 className="text-title-lg font-semibold text-ink mb-6">
            댓글{" "}
            <span className="text-muted font-normal text-sm">
              ({comments.length})
            </span>
          </h2>

          {/* 댓글 목록 */}
          {comments.length === 0 ? (
            <p className="text-muted text-sm text-center py-8 border border-hairline rounded-xl mb-6">
              아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요.
            </p>
          ) : (
            <div className="space-y-4 mb-8">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-surface-soft rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-ink">
                      {comment.profiles?.display_name ?? "익명"}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(comment.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="text-sm text-body leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 댓글 작성 폼 */}
          {user ? (
            <CommentForm postId={postId} />
          ) : (
            <div className="bg-surface-soft rounded-xl p-6 text-center">
              <p className="text-sm text-muted mb-3">
                댓글을 작성하려면 로그인이 필요합니다.
              </p>
              <Button href="/auth/login" variant="primary" size="md">
                로그인하기
              </Button>
            </div>
          )}
        </section>

        {/* 목록으로 */}
        <div className="mt-10 pt-6 border-t border-hairline">
          <Link
            href="/community"
            className="text-sm text-muted hover:text-primary transition-colors"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
