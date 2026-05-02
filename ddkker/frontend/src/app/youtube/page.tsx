export const metadata = {
  title: "YouTube",
  description: "딸깍러 YouTube 채널에서 무료 강의 영상을 확인하세요.",
};

// 수동 등록 YouTube 영상 목록 (향후 YouTube Data API로 자동화)
const YOUTUBE_VIDEOS = [
  {
    id: "1",
    title: "Claude Code로 5분 만에 Next.js 앱 만들기",
    videoId: "dQw4w9WgXcQ", // 실제 영상 ID로 교체
    description: "바이브코딩 입문 — Claude Code와 대화만으로 프로젝트를 시작하는 방법",
    publishedAt: "2026-04-01",
    duration: "12:34",
    tags: ["바이브코딩", "Claude Code", "입문"],
  },
  {
    id: "2",
    title: "Supabase Auth + Google 로그인 완전 정복",
    videoId: "dQw4w9WgXcQ", // 실제 영상 ID로 교체
    description: "trigger로 프로필 자동 생성, middleware로 세션 갱신까지 한 번에",
    publishedAt: "2026-04-15",
    duration: "18:22",
    tags: ["Supabase", "Google Auth", "중급"],
  },
  {
    id: "3",
    title: "Cloudflare R2로 파일 관리하기",
    videoId: "dQw4w9WgXcQ", // 실제 영상 ID로 교체
    description: "egress 무료 R2 + presigned URL로 안전한 파일 다운로드 서비스 구축",
    publishedAt: "2026-04-28",
    duration: "15:47",
    tags: ["Cloudflare R2", "presigned URL", "중급"],
  },
] as const;

export default function YouTubePage() {
  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        {/* 헤더 */}
        <div className="mb-12">
          <h1 className="text-display-lg font-serif font-normal text-ink mb-3">
            YouTube
          </h1>
          <p className="text-muted text-lg">
            무료 강의 영상을 YouTube에서도 확인하세요.
          </p>
        </div>

        {/* 채널 카드 */}
        <div className="bg-surface-dark text-on-dark rounded-2xl p-8 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="font-mono text-white text-2xl font-bold">▌</span>
          </div>
          <div className="flex-1">
            <h2 className="text-title-lg font-semibold text-on-dark mb-1">
              딸깍러 채널
            </h2>
            <p className="text-on-dark-soft text-sm mb-4">
              바이브코딩으로 SaaS를 만드는 과정을 공유합니다.
              구독하고 새 영상을 놓치지 마세요.
            </p>
            <a
              href="https://www.youtube.com/@ddkker"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              YouTube 구독하기
            </a>
          </div>
        </div>

        {/* 영상 그리드 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {YOUTUBE_VIDEOS.map((video) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-canvas border border-hairline rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all"
            >
              {/* 썸네일 */}
              <div className="aspect-video relative bg-surface-dark overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* 재생 버튼 오버레이 */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <svg
                      className="w-5 h-5 text-ink ml-0.5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {/* 재생 시간 */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                  {video.duration}
                </div>
              </div>

              {/* 정보 */}
              <div className="p-4">
                <div className="flex flex-wrap gap-1 mb-2">
                  {video.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-muted bg-surface-soft px-2 py-0.5 rounded-pill"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-title-sm font-semibold text-ink mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
                <p className="text-xs text-muted line-clamp-2">
                  {video.description}
                </p>
                <p className="text-xs text-muted mt-2">
                  {new Date(video.publishedAt).toLocaleDateString("ko-KR")}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* 더 보기 */}
        <div className="mt-10 text-center">
          <a
            href="https://www.youtube.com/@ddkker"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            YouTube에서 전체 영상 보기 →
          </a>
        </div>
      </div>
    </main>
  );
}
