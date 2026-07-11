import { Skeleton, PoolCardSkeleton } from '@/components/ui/Skeleton';

/** 홈 로딩 스켈레톤 — force-dynamic 데이터 로드 동안 표시(HomeClient 레이아웃과 정렬). */
export default function HomeLoading() {
  return (
    <main className="mx-auto w-full max-w-md px-6 pt-12 pb-24">
      <div className="flex flex-col gap-4">
        <div className="flex h-11 items-center justify-between">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-16 rounded-full" />
          <Skeleton className="h-9 w-16 rounded-full" />
        </div>
        <Skeleton className="h-6 w-40 rounded-md" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <PoolCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
