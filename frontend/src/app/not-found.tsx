import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-canvas">
      <div className="text-center px-6">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
          404
        </p>
        <h1 className="font-display text-display-md text-ink mb-4">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-body text-muted mb-8 max-w-md mx-auto">
          요청하신 페이지가 존재하지 않거나 이동됐습니다.
        </p>
        <Button href="/" variant="primary">
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
