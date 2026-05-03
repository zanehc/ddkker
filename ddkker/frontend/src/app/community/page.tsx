import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { Post } from "@/types";

export const revalidate = 30;

export const metadata = {
  title: "커뮤니티",
  description: "바이브코딩, SaaS 개발 관련 Q&A와 수강 후기를 나눠보세요.",
};

type BoardType = "qa" | "review" | "project";

const BOARD_LABELS: Record<BoardType | "all", string> = {
  all: "전체",
  qa: "Q&A",
  review: "수강 후기",
  project: "프로젝트",
};

interface PageProps {
  searchParams: { board?: string };
}

type PostWithProfile = Post & {
  profiles: { display_name: string | null } | null;
};

export default async function CommunityPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const activeBoard = (searchParams.board ?? "all") as BoardType | "all";

  let query = supabase
    .from("posts")
    .select("id, board, title, views, is_pinned, created_at, user_id, profiles(display_name)")
    .eq("is_hidden", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (activeBoard !== "all") {
    query = query.eq("board", activeBoard);
  }

  const { data: postsData } = await query;
  const posts: PostWithProfile[] = (postsData ?? []) as unknown as PostWithProfile[];

  // 현재 사용자 확인 (글쓰기 버튼 표시용)
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[1000px] mx-auto px-6 py-16">
        {/* 헤더 */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-display-lg font-bold text-ink mb-2">
              커뮤니티
            </h1>
            <p className="text-muted">
              Q&A, 수강 후기, 프로젝트 공유를 나눠보세요.
            </p>
          </div>
          {user ? (
            <Button href="/community/new" variant="primary">
              글쓰기
            </Button>
          ) : (
            <Button href="/auth/login" variant="secondary">
              로그인 후 글쓰기
            </Button>
          )}
        </div>

        {/* 게시판 탭 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(Object.keys(BOARD_LABELS) as Array<BoardType | "all">).map((board) => (
            <Link
              key={board}
              href={board === "all" ? "/community" : `/community?board=${board}`}
              className={`px-4 py-2 rounded-pill text-sm font-medium border transition-colors ${
                activeBoard === board
                  ? "bg-primary text-white border-primary"
                  : "bg-canvas text-muted border-hairline hover:border-primary/40 hover:text-ink"
              }`}
            >
              {BOARD_LABELS[board]}
            </Link>
          ))}
        </div>

        {/* 게시글 목록 */}
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted text-lg mb-4">
              아직 게시글이 없습니다.
            </p>
            {user && (
              <Button href="/community/new" variant="primary">
                첫 번째 글 작성하기
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-hairline border border-hairline rounded-xl overflow-hidden">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="flex items-start gap-4 px-5 py-4 bg-canvas hover:bg-surface-soft transition-colors"
              >
                {/* 게시판 배지 */}
                <span
                  className={`flex-shrink-0 mt-0.5 text-xs font-semibold uppercase px-2 py-1 rounded ${
                    post.board === "qa"
                      ? "bg-primary/10 text-primary"
                      : post.board === "review"
                      ? "bg-success/10 text-success"
                      : "bg-accent-amber/20 text-amber-700"
                  }`}
                >
                  {BOARD_LABELS[post.board]}
                </span>

                {/* 제목 + 메타 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    {post.is_pinned && (
                      <span className="flex-shrink-0 text-primary text-xs mt-0.5">
                        📌
                      </span>
                    )}
                    <h2 className="text-sm font-medium text-ink line-clamp-1 hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted">
                      {post.profiles?.display_name ?? "익명"}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(post.created_at).toLocaleDateString("ko-KR")}
                    </span>
                    <span className="text-xs text-muted">
                      조회 {post.views.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
