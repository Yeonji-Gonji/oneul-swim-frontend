import { Skeleton } from '@/components/ui/Skeleton';

/** 맵-퍼스트 홈 로딩 스켈레톤 — 전체 지도 로드/데이터 fetch 동안 표시. */
export default function HomeLoading() {
  return (
    <div className="fixed inset-0 mx-auto w-full max-w-md overflow-hidden bg-bg">
      {/* 지도 자리 */}
      <div className="absolute inset-0 skeleton" />
      {/* 상단 플로팅 필터 자리 */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col gap-2 px-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
      {/* 바텀시트 자리 */}
      <div
        className="absolute inset-x-0 flex flex-col gap-3 rounded-t-sheet bg-surface p-5 shadow-sheet"
        style={{ bottom: 'var(--tabbar-h)', height: '32%' }}
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-line" />
        <Skeleton className="h-6 w-40 rounded-md" />
        <Skeleton className="h-16 w-full rounded-input" />
        <Skeleton className="h-16 w-full rounded-input" />
      </div>
    </div>
  );
}
