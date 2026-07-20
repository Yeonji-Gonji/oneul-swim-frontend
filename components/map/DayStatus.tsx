import type { DayCode, Pool } from '@/lib/types';
import { getPoolNowStatus, sessionsOnWeekday } from '@/lib/pools';
import type { Dayjs } from '@/lib/time';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/cn';

/** 지도 탐색 요일 필터 값 — 'today'(실시간) 또는 요일 코드 */
export type DayFilter = 'today' | DayCode;

export const DAY_OPTIONS: { v: DayFilter; label: string }[] = [
  { v: 'today', label: '오늘' },
  { v: 1, label: '월' },
  { v: 2, label: '화' },
  { v: 3, label: '수' },
  { v: 4, label: '목' },
  { v: 5, label: '금' },
  { v: 6, label: '토' },
  { v: 0, label: '일' },
];

/** 리스트/플로팅박스 상태 표시 — 오늘은 실시간 뱃지, 다른 요일은 그날 운영 요약 */
export function DayStatus({
  pool,
  day,
  now,
}: {
  pool: Pool;
  day: DayFilter;
  now: Dayjs;
}) {
  if (day === 'today') {
    return <StatusBadge status={getPoolNowStatus(pool, now)} />;
  }
  const listing = !pool.freeSwim || pool.freeSwim.sessions.length === 0;
  const ss = listing ? [] : sessionsOnWeekday(pool, day);
  const label = DAY_OPTIONS.find((d) => d.v === day)?.label ?? '';
  let text: string;
  let tone: 'open' | 'gray';
  if (listing) {
    text = '자유수영 정보 준비중';
    tone = 'gray';
  } else if (ss.length > 0) {
    const times = ss
      .slice(0, 2)
      .map((s) => `${s.start}~${s.end}`)
      .join(', ');
    text = `${label} ${times}`;
    tone = 'open';
  } else {
    text = `${label}요일 자유수영 없음`;
    tone = 'gray';
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
        tone === 'open'
          ? 'bg-now-open-soft text-now-open-ink'
          : 'bg-closed-soft text-closed-ink',
      )}
    >
      <span
        className={cn(
          'size-2 rounded-full',
          tone === 'open' ? 'bg-now-open' : 'bg-closed',
        )}
        aria-hidden
      />
      {text}
    </span>
  );
}
