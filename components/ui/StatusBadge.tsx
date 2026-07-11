import type { NowStatus } from '@/lib/pools';
import { cn } from '@/lib/cn';

/**
 * 지금 상태 뱃지(틴트 pill) — Figma Home 디자인 바인딩.
 * getPoolNowStatus() 결과를 상태색 10% 배경 + 잉크 텍스트 + 점으로.
 * Tailwind JIT 인식 위해 상태별 클래스는 정적 리터럴.
 */
interface View {
  label: string;
  pill: string;
  dot: string;
  ink: string;
}

function describe(status: NowStatus): View {
  switch (status.kind) {
    case 'open':
      return {
        label: `지금 자유수영 ~${status.endsAt}`,
        pill: 'bg-now-open-soft',
        dot: 'bg-now-open',
        ink: 'text-now-open-ink',
      };
    case 'soon':
      return {
        label: `${status.startsAt}부터 가능`,
        pill: 'bg-upcoming-soft',
        dot: 'bg-upcoming',
        ink: 'text-upcoming-ink',
      };
    case 'closed-today':
      return {
        label: '오늘 자유수영 종료',
        pill: 'bg-closed-soft',
        dot: 'bg-closed',
        ink: 'text-closed-ink',
      };
    case 'none-today':
      return {
        label: '오늘 자유수영 없음',
        pill: 'bg-closed-soft',
        dot: 'bg-closed',
        ink: 'text-closed-ink',
      };
    case 'listing':
      return {
        label: '자유수영 정보 준비중',
        pill: 'bg-closed-soft',
        dot: 'bg-closed',
        ink: 'text-closed-ink',
      };
  }
}

export function StatusBadge({ status }: { status: NowStatus }) {
  const v = describe(status);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        v.pill,
      )}
    >
      <span className={cn('size-2 rounded-full', v.dot)} aria-hidden />
      <span className={cn('text-xs font-bold', v.ink)}>{v.label}</span>
    </span>
  );
}
