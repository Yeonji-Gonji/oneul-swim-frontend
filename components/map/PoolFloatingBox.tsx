'use client';

import Link from 'next/link';
import type { Pool } from '@/lib/types';
import type { Dayjs } from '@/lib/time';
import { freeSwimTimeSummary } from '@/lib/pools';
import { DayStatus, type DayFilter } from '@/components/map/DayStatus';

/**
 * 마커 위 플로팅박스 — 이름·운영시간 요약·상태 라벨 3개 필드만 표시(REQ-006).
 * kakao CustomOverlay(yAnchor:1) 컨테이너에 포털로 렌더된다.
 * 하단 패딩(pb-10 = 40px)으로 마커 핀 높이(34px) + 6px 간격을 확보해 박스가 핀 위에 뜬다.
 * 본문 탭 → 상세 이동, ✕ 탭 → 닫기(본문 링크 밖 배치 + 전파 차단, REQ-NF-003).
 */
export function PoolFloatingBox({
  pool,
  day,
  now,
  onClose,
}: {
  pool: Pool;
  day: DayFilter;
  now: Dayjs;
  onClose: () => void;
}) {
  const time = freeSwimTimeSummary(pool, day, now);
  return (
    <div className="w-60 pb-10">
      <div className="glass-panel relative rounded-input p-3 shadow-card">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="닫기"
          className="absolute -top-3 -right-3 flex size-11 items-center justify-center"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-fill-secondary text-xs text-text-sub shadow-card">
            ✕
          </span>
        </button>
        <Link
          href={`/pool/${pool.id}`}
          className="flex min-h-11 flex-col justify-center gap-1.5 pr-6"
        >
          <span className="truncate text-body font-bold text-text">
            {pool.name}
          </span>
          {time && <span className="text-sm text-text-sub">{time}</span>}
          <span>
            <DayStatus pool={pool} day={day} now={now} />
          </span>
        </Link>
      </div>
    </div>
  );
}
