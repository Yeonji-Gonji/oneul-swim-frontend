import Link from 'next/link';
import type { FreeSwimTier, Pool, PriceByTarget } from '@/lib/types';
import type { Dayjs } from '@/lib/time';
import { getPoolNowStatus } from '@/lib/pools';
import { formatWon, tierLabel } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FreshnessTag } from '@/components/ui/FreshnessTag';

/** 시설이 제공하는 자유수영 요금(전일/반일)을 세션 tier 기준으로 요약 */
function priceSummary(
  pool: Pool,
  priceTiers: Record<FreeSwimTier, PriceByTarget>,
): string {
  const tiers = new Set(pool.freeSwim.sessions.map((s) => s.tier));
  return (['full', 'half'] as const)
    .filter((t) => tiers.has(t))
    .map((t) => `${tierLabel(t, true)} ${formatWon(priceTiers[t].성인)}`)
    .join(' · ');
}

/** 홈 리스트 카드 — Figma Home 디자인 바인딩. 탭하면 상세로. */
export function PoolCard({
  pool,
  now,
  priceTiers,
  distanceKm,
}: {
  pool: Pool;
  now: Dayjs;
  priceTiers: Record<FreeSwimTier, PriceByTarget>;
  distanceKm?: number;
}) {
  const status = getPoolNowStatus(pool, now);
  return (
    <Link
      href={`/pool/${pool.id}`}
      className="flex w-full flex-col items-start gap-2.5 rounded-input bg-surface p-4 shadow-[1px_1px_4px_0px_rgba(0,0,0,0.12)] transition active:scale-[0.99]"
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-body font-bold text-text">{pool.name}</span>
        <span className="shrink-0 text-sm text-text-sub">
          {distanceKm != null ? `${distanceKm.toFixed(1)}km` : pool.region}
        </span>
      </div>
      <StatusBadge status={status} />
      <span className="text-sm text-text">{priceSummary(pool, priceTiers)}</span>
      <FreshnessTag updatedAt={pool.updatedAt} />
    </Link>
  );
}
