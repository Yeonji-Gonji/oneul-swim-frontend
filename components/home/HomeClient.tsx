'use client';

import { useEffect, useMemo, useState } from 'react';
import { getPoolNowStatus, sortPoolsByStatus, type NowStatus } from '@/lib/pools';
import type { FreeSwimTier, Pool, PriceByTarget } from '@/lib/types';
import { nowInSeoul, type Dayjs } from '@/lib/time';
import { Button } from '@/components/ui/Button';
import { IconMoon } from '@/components/ui/icons';
import { FilterChips, type PoolFilter } from './FilterChips';
import { PoolCard } from './PoolCard';

/**
 * 홈 인터랙티브 영역 — 필터 칩 + 요약 + 시설 리스트.
 * 데이터(pools/priceTiers)는 서버 컴포넌트가 API 우선 로더로 읽어 주입한다(폴백 시 정적).
 * "지금 상태"는 클라이언트에서 사용자 시계(Asia/Seoul) 기준 계산, 1분마다 갱신.
 */
export function HomeClient({
  pools,
  priceTiers,
}: {
  pools: Pool[];
  priceTiers: Record<FreeSwimTier, PriceByTarget>;
}) {
  const [filter, setFilter] = useState<PoolFilter>('now');
  const [now, setNow] = useState<Dayjs>(() => nowInSeoul());

  useEffect(() => {
    const id = setInterval(() => setNow(nowInSeoul()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { visible, openCount, soonCount } = useMemo(() => {
    const withStatus = pools.map((pool) => ({
      pool,
      status: getPoolNowStatus(pool, now),
    }));
    const count = (k: NowStatus['kind']) =>
      withStatus.filter((x) => x.status.kind === k).length;

    const matches = (kind: NowStatus['kind']): boolean => {
      if (filter === 'all') return true;
      if (filter === 'now') return kind === 'open';
      return kind !== 'none-today'; // '오늘' = 오늘 운영일
    };

    const filtered = withStatus
      .filter((x) => matches(x.status.kind))
      .map((x) => x.pool);
    return {
      visible: sortPoolsByStatus(filtered, now),
      openCount: count('open'),
      soonCount: count('soon'),
    };
  }, [filter, now, pools]);

  // '지금 가능' 필터인데 지금 열린 곳이 없을 때 — 리치 empty (Figma Home/지금0곳)
  const emptyNow = filter === 'now' && openCount === 0;

  return (
    <div className="flex flex-col gap-4">
      <FilterChips value={filter} onChange={setFilter} />

      {emptyNow ? (
        <>
          <p className="text-body font-bold text-text">
            지금은 자유수영 가능한 곳이 없어요
          </p>
          <div className="flex flex-col items-center gap-4 rounded-input bg-surface px-4 py-8 shadow-[1px_1px_4px_0px_rgba(0,0,0,0.12)]">
            <IconMoon className="size-8 text-text-sub" />
            <p className="text-center text-sm text-text-sub">
              {soonCount > 0
                ? `오늘 이따 가능한 곳이 ${soonCount}곳 있어요`
                : '오늘은 더 이상 운영하는 곳이 없어요'}
            </p>
            <Button variant="solid" onClick={() => setFilter('today')}>
              오늘 가능한 곳 보기
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-now-open" aria-hidden />
            <span className="text-body font-bold text-now-open-ink">
              {openCount > 0
                ? `지금 자유수영 OK · ${openCount}곳`
                : '오늘 운영하는 곳'}
            </span>
          </div>
          {visible.length > 0 ? (
            <div className="flex flex-col gap-3">
              {visible.map((pool) => (
                <PoolCard
                  key={pool.id}
                  pool={pool}
                  now={now}
                  priceTiers={priceTiers}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-input bg-surface px-4 py-8 text-center text-sm leading-relaxed text-text-sub shadow-[1px_1px_4px_0px_rgba(0,0,0,0.12)]">
              조건에 맞는 수영장이 없어요.
            </p>
          )}
        </>
      )}
    </div>
  );
}
