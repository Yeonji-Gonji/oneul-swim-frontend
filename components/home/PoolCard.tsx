import Link from 'next/link';
import type { Pool } from '@/lib/types';
import type { Dayjs } from '@/lib/time';
import { getPoolNowStatus } from '@/lib/pools';
import { formatWon, tierLabel } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FreshnessTag } from '@/components/ui/FreshnessTag';

/** 시설 지역 표시 라벨 — 시군구 우선, 없으면 세부 region */
function areaLabel(pool: Pool): string {
  return pool.sigungu ?? pool.region ?? pool.sido ?? '';
}

/** 시설이 제공하는 자유수영 요금(전일/반일)을 세션 tier 기준으로 요약 */
function priceSummary(pool: Pool): string {
  const sessions = pool.freeSwim?.sessions ?? [];
  const fees = pool.fees;
  if (!fees || sessions.length === 0) return '';
  const tiers = new Set(sessions.map((s) => s.tier));
  return (['full', 'half'] as const)
    .filter((t) => tiers.has(t) && fees[t]?.성인 != null)
    .map((t) => `${tierLabel(t, true)} ${formatWon(fees[t]!.성인!)}`)
    .join(' · ');
}

/** 홈 리스트 카드 — Figma Home 디자인 바인딩. 탭하면 상세로. */
export function PoolCard({
  pool,
  now,
  distanceKm,
}: {
  pool: Pool;
  now: Dayjs;
  distanceKm?: number;
}) {
  const status = getPoolNowStatus(pool, now);
  const summary = priceSummary(pool);
  return (
    <Link
      href={`/pool/${pool.id}`}
      className="flex w-full flex-col items-start gap-2.5 rounded-input bg-surface p-4 shadow-card transition duration-150 active:scale-[0.98]"
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-body font-bold text-text">{pool.name}</span>
        <span className="shrink-0 text-sm text-text-sub">
          {distanceKm != null ? `${distanceKm.toFixed(1)}km` : areaLabel(pool)}
        </span>
      </div>
      <StatusBadge status={status} />
      {summary && <span className="text-sm text-text">{summary}</span>}
      <FreshnessTag updatedAt={pool.updatedAt} />
    </Link>
  );
}
