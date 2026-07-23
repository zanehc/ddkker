export default function Loading() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"
          aria-label="로딩 중"
        />
        <p className="text-sm text-muted">불러오는 중...</p>
      </div>
    </div>
  );
}
