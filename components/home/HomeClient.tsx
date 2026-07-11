'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getPoolNowStatus, sortPoolsByStatus, type NowStatus } from '@/lib/pools';
import type { Pool } from '@/lib/types';
import { nowInSeoul, type Dayjs } from '@/lib/time';
import { Button } from '@/components/ui/Button';
import { IconMoon } from '@/components/ui/icons';
import { Header } from '@/components/layout/Header';
import { FilterChips, type PoolFilter } from './FilterChips';
import { PoolCard } from './PoolCard';

/**
 * 홈 인터랙티브 영역 — 지역(시도) 필터 + 상태 필터 칩 + 요약 + 시설 리스트.
 * 데이터(pools)는 서버 컴포넌트가 API 우선 로더로 읽어 주입한다(폴백 시 정적).
 * 요금은 각 pool.fees 에 실려 오므로 별도 주입이 필요 없다.
 * "지금 상태"는 클라이언트에서 사용자 시계(Asia/Seoul) 기준 계산, 1분마다 갱신.
 */
export function HomeClient({
  pools,
  headerRight,
}: {
  pools: Pool[];
  headerRight?: ReactNode;
}) {
  const [filter, setFilter] = useState<PoolFilter>('now');
  const [sido, setSido] = useState<string>('all');
  const [sigungu, setSigungu] = useState<string>('all');
  const [now, setNow] = useState<Dayjs>(() => nowInSeoul());

  useEffect(() => {
    const id = setInterval(() => setNow(nowInSeoul()), 60_000);
    return () => clearInterval(id);
  }, []);

  // 데이터에 존재하는 시도 목록 (전국 확장 시 필터로 노출)
  const sidoOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of pools) if (p.sido) set.add(p.sido);
    return [...set].sort();
  }, [pools]);

  // 선택된 시도의 시군구 목록
  const sigunguOptions = useMemo(() => {
    if (sido === 'all') return [];
    const set = new Set<string>();
    for (const p of pools) {
      if (p.sido === sido && p.sigungu) set.add(p.sigungu);
    }
    return [...set].sort();
  }, [pools, sido]);

  const scoped = useMemo(() => {
    return pools.filter((p) => {
      if (sido !== 'all' && p.sido !== sido) return false;
      if (sigungu !== 'all' && p.sigungu !== sigungu) return false;
      return true;
    });
  }, [pools, sido, sigungu]);

  const handleSidoChange = (newSido: string) => {
    setSido(newSido);
    setSigungu('all'); // 시도가 바뀌면 시군구 선택 초기화
  };

  const { visible, openCount, soonCount } = useMemo(() => {
    const withStatus = scoped.map((pool) => ({
      pool,
      status: getPoolNowStatus(pool, now),
    }));
    const count = (k: NowStatus['kind']) =>
      withStatus.filter((x) => x.status.kind === k).length;

    const matches = (kind: NowStatus['kind']): boolean => {
      if (filter === 'all') return true;
      if (filter === 'now') return kind === 'open';
      // '오늘' = 오늘 운영일 (리스팅/미운영 제외)
      return kind !== 'none-today' && kind !== 'listing';
    };

    const filtered = withStatus
      .filter((x) => matches(x.status.kind))
      .map((x) => x.pool);
    return {
      visible: sortPoolsByStatus(filtered, now),
      openCount: count('open'),
      soonCount: count('soon'),
    };
  }, [filter, now, scoped]);

  // '지금 가능' 필터인데 지금 열린 곳이 없을 때 — 리치 empty (Figma Home/지금0곳)
  const emptyNow = filter === 'now' && openCount === 0;

  // 헤더에 표시할 지역 이름 동적 계산
  const headerLabel =
    sido === 'all' ? '전국' : sigungu === 'all' ? sido : sigungu;

  return (
    <div className="flex flex-col gap-4">
      <Header variant="location" label={headerLabel} right={headerRight} />
      
      {sidoOptions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <select
            value={sido}
            onChange={(e) => handleSidoChange(e.target.value)}
            className="w-fit rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-text"
            aria-label="지역(시도) 선택"
          >
            <option value="all">전국</option>
            {sidoOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {sido !== 'all' && sigunguOptions.length > 1 && (
            <select
              value={sigungu}
              onChange={(e) => setSigungu(e.target.value)}
              className="w-fit rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-text"
              aria-label="지역(시군구) 선택"
            >
              <option value="all">전체</option>
              {sigunguOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <FilterChips value={filter} onChange={setFilter} />

      {emptyNow ? (
        <>
          <p className="text-body font-bold text-text">
            지금은 자유수영 가능한 곳이 없어요
          </p>
          <div className="flex flex-col items-center gap-4 rounded-input bg-surface px-4 py-8 shadow-card">
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
                <PoolCard key={pool.id} pool={pool} now={now} />
              ))}
            </div>
          ) : (
            <p className="rounded-input bg-surface px-4 py-8 text-center text-sm leading-relaxed text-text-sub shadow-card">
              조건에 맞는 수영장이 없어요.
            </p>
          )}
        </>
      )}
    </div>
  );
}
