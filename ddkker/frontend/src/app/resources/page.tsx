import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { Resource } from "@/types";

export const revalidate = 300;

export const metadata = {
  title: "자료실",
  description: "강의에서 사용한 소스코드, 설치 가이드, 템플릿을 다운로드하세요.",
};

type ResourceCategory =
  | "all"
  | "code-template"
  | "lecture-material"
  | "install-guide"
  | "source-code";

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  all: "전체",
  "code-template": "코드 템플릿",
  "lecture-material": "강의 자료",
  "install-guide": "설치 가이드",
  "source-code": "소스코드",
};

const FILE_TYPE_ICON: Record<string, string> = {
  pdf: "📄",
  zip: "📦",
  md: "📝",
  txt: "📃",
  default: "📎",
};

interface PageProps {
  searchParams: { category?: string };
}

export default async function ResourcesPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const activeCategory = (searchParams.category ?? "all") as ResourceCategory;

  let query = supabase
    .from("resources")
    .select("id, title, description, category, file_type, file_size_bytes, course_id, download_count, tier, published, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (activeCategory !== "all") {
    query = query.eq("category", activeCategory);
  }

  const { data: resourcesData } = await query;
  const resources: Omit<Resource, "file_key">[] = (resourcesData ?? []) as Omit<Resource, "file_key">[];

  // 현재 사용자 세션 확인 (lock 오버레이 표시용)
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        {/* 헤더 */}
        <div className="mb-10">
          <h1 className="text-display-lg font-bold text-ink mb-3">
            자료실
          </h1>
          <p className="text-muted text-lg">
            강의에서 사용한 소스코드, 템플릿, 가이드를 다운로드하세요.
            프리미엄 자료는 멤버십이 필요합니다.
          </p>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex flex-wrap gap-2 mb-10">
          {(Object.keys(CATEGORY_LABELS) as ResourceCategory[]).map((cat) => (
            <Link
              key={cat}
              href={cat === "all" ? "/resources" : `/resources?category=${cat}`}
              className={`px-4 py-2 rounded-pill text-sm font-medium border transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-white border-primary"
                  : "bg-canvas text-muted border-hairline hover:border-primary/40 hover:text-ink"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </Link>
          ))}
        </div>

        {/* 자료 그리드 */}
        {resources.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted text-lg">
              해당 카테고리에 자료가 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => {
              const isPremium = resource.tier === "premium";
              const fileIcon =
                FILE_TYPE_ICON[resource.file_type ?? "default"] ??
                FILE_TYPE_ICON.default;

              return (
                <div
                  key={resource.id}
                  className="relative bg-canvas border border-hairline rounded-xl p-5 hover:border-primary/30 transition-all group"
                >
                  {/* 프리미엄 잠금 오버레이 */}
                  {isPremium && !user && (
                    <div className="absolute inset-0 rounded-xl bg-canvas/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <div className="text-2xl mb-2">🔒</div>
                      <p className="text-sm font-medium text-ink mb-3">
                        프리미엄 자료
                      </p>
                      <Button href="/premium" variant="primary" size="md">
                        프리미엄 보기
                      </Button>
                    </div>
                  )}

                  {/* 아이콘 + 제목 */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-2xl flex-shrink-0">{fileIcon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-title-sm font-semibold text-ink leading-snug mb-1 line-clamp-2">
                        {resource.title}
                      </h3>
                      {resource.description && (
                        <p className="text-xs text-muted line-clamp-2">
                          {resource.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 메타 정보 */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                      <Badge variant={isPremium ? "primary" : "free"}>
                        {isPremium ? "프리미엄" : "무료"}
                      </Badge>
                      {resource.file_type && (
                        <span className="text-xs text-muted uppercase font-mono">
                          {resource.file_type}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted">
                      {resource.download_count.toLocaleString()}회 다운로드
                    </span>
                  </div>

                  {/* 다운로드 버튼 */}
                  {(!isPremium || user) && (
                    <div className="mt-4">
                      <a
                        href={`/api/resources/download/${resource.id}`}
                        className="block text-center py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary hover:text-white transition-colors"
                      >
                        다운로드
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
