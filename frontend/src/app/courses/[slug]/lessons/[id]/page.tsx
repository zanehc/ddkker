import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/server/admin-client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonComments } from "@/components/lessons/LessonComments";
import { activeEnrollmentFilter } from "@/lib/enrollment";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string; id: string };
}

export default async function LessonWatchPage({ params }: PageProps) {
  const supabase = createClient();
  const lessonId = Number(params.id);
  if (!Number.isFinite(lessonId)) notFound();

  // 강의 + 수업 메타 (게이팅은 아래에서 직접 수행하므로 adminClient로 조회)
  const { data: course } = await adminClient
    .from("courses")
    .select("id, title, slug, tier, published")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!course || !course.published) notFound();

  const { data: lesson } = await adminClient
    .from("lessons")
    .select("id, course_id, title, duration_min, tier, video_url, body, published")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson || lesson.course_id !== course.id || !lesson.published) notFound();

  // 사용자 + 접근권
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let enrolled = false;
  let isAdmin = false;
  if (user) {
    const [{ data: enr }, { data: adm }] = await Promise.all([
      adminClient
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", course.id)
        .eq("status", "active")
        .or(activeEnrollmentFilter())
        .maybeSingle(),
      adminClient
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    enrolled = !!enr;
    isAdmin = !!adm;
  }

  const unlocked =
    lesson.tier === "free" || course.tier === "free" || enrolled || isAdmin;
  const canComment = !!user && (course.tier === "free" || enrolled || isAdmin);

  const Breadcrumb = (
    <div className="flex items-center gap-2 text-sm text-muted mb-6">
      <Link href={`/courses/${course.slug}`} className="hover:text-primary transition-colors">
        {course.title}
      </Link>
      <span>/</span>
      <span className="text-ink truncate max-w-[280px]">{lesson.title}</span>
    </div>
  );

  // 미구매 프리미엄 → 잠금 화면
  if (!unlocked) {
    return (
      <main className="bg-canvas min-h-screen">
        <div className="max-w-[800px] mx-auto px-6 py-16">
          {Breadcrumb}
          <div className="border border-hairline rounded-xl p-12 text-center bg-surface-soft">
            <div className="text-3xl mb-3">🔒</div>
            <h1 className="text-title-lg font-bold text-ink mb-2">{lesson.title}</h1>
            <p className="text-muted text-sm mb-6">
              이 수업은 강의를 구매한 회원만 시청할 수 있습니다.
            </p>
            <Link
              href="/premium"
              className="inline-block py-3 px-6 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary-active transition-colors"
            >
              프리미엄에서 구매하기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const hasVideo = !!lesson.video_url;

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[900px] mx-auto px-6 py-12">
        {Breadcrumb}

        <h1 className="text-display-sm font-bold text-ink mb-1">{lesson.title}</h1>
        {lesson.duration_min && (
          <p className="text-sm text-muted mb-6">러닝타임 {lesson.duration_min}분</p>
        )}

        {/* 영상 영역 */}
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-ink/90 mb-8 flex items-center justify-center">
          {hasVideo ? (
            // 영상 호스팅 확정 전: 연결된 video_url을 직접 재생.
            // (Cloudflare Stream/R2 서명 등으로 추후 교체 예정)
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              controls
              controlsList="nodownload"
              className="w-full h-full"
              src={lesson.video_url as string}
            />
          ) : (
            <div className="text-center text-white/70">
              <div className="text-2xl mb-2">🎬</div>
              <p className="text-sm">영상 준비중입니다.</p>
            </div>
          )}
        </div>

        {/* 강의 노트 */}
        {lesson.body && (
          <section className="mb-10">
            <h2 className="text-title-md font-semibold text-ink mb-3">강의 노트</h2>
            <div className="prose prose-sm max-w-none text-body whitespace-pre-wrap leading-relaxed">
              {lesson.body}
            </div>
          </section>
        )}

        {/* 댓글/대댓글 */}
        <section className="border-t border-hairline pt-8">
          <LessonComments
            lessonId={lesson.id}
            canComment={canComment}
            currentUserId={user?.id ?? null}
          />
        </section>
      </div>
    </main>
  );
}
