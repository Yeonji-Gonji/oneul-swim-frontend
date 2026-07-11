import { cn } from '@/lib/cn';

/**
 * 스켈레톤 블록 — shimmer 로딩 플레이스홀더.
 * `.skeleton` 클래스(globals.css)가 배경 + shimmer 오버레이를 담당한다.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-input', className)} />;
}

/** 홈 리스트 카드 형태의 스켈레톤 1장 (PoolCard 레이아웃과 정렬) */
export function PoolCardSkeleton() {
  return (
    <div className="flex w-full flex-col items-start gap-2.5 rounded-input bg-surface p-4 shadow-card">
      <div className="flex w-full items-center justify-between">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-4 w-10 rounded-md" />
      </div>
      <Skeleton className="h-7 w-32 rounded-full" />
      <Skeleton className="h-4 w-24 rounded-md" />
      <Skeleton className="h-3 w-20 rounded-md" />
    </div>
  );
}
