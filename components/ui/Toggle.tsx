'use client';

import { cn } from '@/lib/cn';

/** 재사용 스위치 토글 (강습 알림 구독·설정 등 공용) */
export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        'relative h-6 w-10 shrink-0 rounded-full transition-colors',
        on ? 'bg-primary' : 'bg-line',
      )}>
      <span
        className={cn(
          'absolute top-0.5 size-5 rounded-full bg-white shadow transition-all',
          on ? 'left-[18px]' : 'left-0.5',
        )}
      />
    </button>
  );
}
