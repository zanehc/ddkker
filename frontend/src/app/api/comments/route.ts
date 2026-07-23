import { createClient } from "@/lib/supabase/server";
import { postRatelimit, checkRateLimit } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("post_id");

  if (!postId) {
    return NextResponse.json({ error: "post_id가 필요합니다" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, user_id, content, created_at, profiles(display_name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  // Rate limit
  const rateLimitError = await checkRateLimit(req, postRatelimit);
  if (rateLimitError) return rateLimitError;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await req.json();
  const { post_id, content } = body;

  // 입력 검증
  if (!post_id || isNaN(Number(post_id))) {
    return NextResponse.json({ error: "유효한 게시글 ID가 필요합니다" }, { status: 400 });
  }

  if (!content?.trim()) {
    return NextResponse.json({ error: "내용을 입력하세요" }, { status: 400 });
  }

  if (content.trim().length < 1 || content.trim().length > 2000) {
    return NextResponse.json(
      { error: "댓글은 1자 이상 2000자 이하여야 합니다" },
      { status: 400 }
    );
  }

  // 게시글 존재 확인
  const { data: post } = await supabase
    .from("posts")
    .select("id, is_hidden")
    .eq("id", post_id)
    .single();

  if (!post || post.is_hidden) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }

  // user_id는 서버 세션에서 주입 (클라이언트 입력 무시)
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: Number(post_id),
      content: content.trim(),
      user_id: user.id,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
