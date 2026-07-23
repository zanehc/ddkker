import { createClient } from "@/lib/supabase/server";
import { postRatelimit, checkRateLimit } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const board = searchParams.get("board");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

  let query = supabase
    .from("posts")
    .select("id, board, title, views, is_pinned, created_at, user_id")
    .eq("is_hidden", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (board && ["qa", "review", "project"].includes(board)) {
    query = query.eq("board", board);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const rateLimitError = await checkRateLimit(req, postRatelimit);
  if (rateLimitError) return rateLimitError;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await req.json();
  const { board, title, content } = body;

  // 입력 검증
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 입력하세요" }, { status: 400 });
  }

  if (title.trim().length < 2 || title.trim().length > 200) {
    return NextResponse.json(
      { error: "제목은 2자 이상 200자 이하여야 합니다" },
      { status: 400 }
    );
  }

  if (content.trim().length < 2 || content.trim().length > 10000) {
    return NextResponse.json(
      { error: "내용은 2자 이상 10000자 이하여야 합니다" },
      { status: 400 }
    );
  }

  const validBoards = ["qa", "review", "project"];
  if (board && !validBoards.includes(board)) {
    return NextResponse.json({ error: "유효하지 않은 게시판입니다" }, { status: 400 });
  }

  // user_id는 서버 세션에서 주입 (클라이언트 입력 무시)
  const { data, error } = await supabase
    .from("posts")
    .insert({
      board: board ?? "qa",
      title: title.trim(),
      content: content.trim(),
      user_id: user.id,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
