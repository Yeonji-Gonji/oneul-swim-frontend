'use client';

import { useEffect, useState } from 'react';
import type { DayCode, Pool } from '@/lib/types';
import { getPoolNowStatus } from '@/lib/pools';
import { tierLabel } from '@/lib/format';
import { nowInSeoul, type Dayjs } from '@/lib/time';
import { cn } from '@/lib/cn';

const DAYS: Array<{ code: DayCode; label: string }> = [
  { code: 1, label: '월' },
  { code: 2, label: '화' },
  { code: 3, label: '수' },
  { code: 4, label: '목' },
  { code: 5, label: '금' },
  { code: 6, label: '토' },
  { code: 0, label: '일' },
];
const DOW = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * 요일 탭 + 선택 요일의 자유수영 슬롯 (Figma Detail 바인딩).
 * 오늘 진행 중 세션은 워터블루 하이라이트 + "지금".
 * 시간 계산은 클라이언트(사용자 시계, Asia/Seoul) — 1분 갱신.
 */
export function DaySchedule({ pool }: { pool: Pool }) {
  const [now, setNow] = useState<Dayjs>(() => nowInSeoul());
  const [sel, setSel] = useState<DayCode>(() => nowInSeoul().day() as DayCode);

  useEffect(() => {
    const id = setInterval(() => setNow(nowInSeoul()), 60_000);
    return () => clearInterval(id);
  }, []);

  const status = getPoolNowStatus(pool, now);
  const ongoing = status.kind === 'open' ? status.session : null;
  const isToday = sel === (now.day() as DayCode);

  const slots = (pool.freeSwim?.sessions ?? [])
    .filter((s) => s.dayCodes.includes(sel))
    .sort((a, b) => toMin(a.start) - toMin(b.start));

  return (
    <section className="flex w-full flex-col gap-4">
      {/* 요일 탭 */}
      <div className="flex items-start justify-between">
        {DAYS.map(({ code, label }) => {
          const active = code === sel;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setSel(code)}
              className="flex flex-col items-center gap-1.5 py-1.5"
            >
              <span
                className={cn(
                  'text-[15px]',
                  active
                    ? 'font-bold text-primary'
                    : 'font-normal text-text-sub',
                )}
              >
                {label}
              </span>
              <span
                className={cn(
                  'h-0.5 w-[22px]',
                  active ? 'bg-primary' : 'bg-transparent',
                )}
              />
            </button>
          );
        })}
      </div>

      <p className="text-sm font-bold text-text">자유수영 · {DOW[sel]}</p>

      {slots.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {slots.map((s, i) => {
            const isNow = isToday && s === ongoing;
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center justify-between rounded-button px-3.5 py-3',
                  isNow ? 'bg-primary-10' : 'bg-surface',
                )}
              >
                <span
                  className={cn(
                    'text-[15px] tabular-nums',
                    isNow
                      ? 'font-bold text-primary-strong'
                      : 'font-normal text-text',
                  )}
                >
                  {s.start} – {s.end}
                </span>
                <span
                  className={cn(
                    'text-sm',
                    isNow ? 'text-primary' : 'text-text-sub',
                  )}
                >
                  {[s.pool, tierLabel(s.tier), isNow && '지금']
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-button bg-surface px-3.5 py-6 text-center text-sm text-text-sub">
          이 요일은 자유수영 운영이 없어요.
        </p>
      )}
    </section>
  );
}
