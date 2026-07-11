import { Skeleton } from '@/components/ui/Skeleton';

/** 시설 상세 로딩 스켈레톤 — 상세 페이지 레이아웃과 정렬. */
export default function PoolDetailLoading() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 pt-12 pb-10">
      <div className="flex h-11 items-center gap-2">
        <Skeleton className="size-6 rounded-md" />
        <Skeleton className="h-6 w-44 rounded-md" />
      </div>
      <Skeleton className="h-7 w-40 rounded-full" />
      <Skeleton className="h-24 w-full rounded-input" />
      <Skeleton className="h-40 w-full rounded-input" />
      <div className="flex gap-2.5">
        <Skeleton className="h-14 flex-1 rounded-button" />
        <Skeleton className="h-14 flex-1 rounded-button" />
      </div>
      <Skeleton className="h-14 w-full rounded-button" />
    </main>
  );
}
