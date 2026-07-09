import type { FreeSwimTier, Pool, PriceByTarget } from '@/lib/types';
import { dayjs } from '@/lib/time';
import { formatWon as won } from '@/lib/format';

/** 자유수영 이용권 요금 카드 (Figma Detail 바인딩). 요금표는 API 우선 로더가 주입 */
export function FeeCard({
  pool,
  priceTiers,
}: {
  pool: Pool;
  priceTiers: Record<FreeSwimTier, PriceByTarget>;
}) {
  const tiers = new Set(pool.freeSwim.sessions.map((s) => s.tier));
  const pass = pool.freeSwim.monthlyPass;
  return (
    <section className="flex w-full flex-col gap-2.5 rounded-input bg-surface p-4 shadow-[1px_1px_4px_0px_rgba(0,0,0,0.12)]">
      <h2 className="text-body font-bold text-text">자유수영 이용권</h2>
      {tiers.has('full') && (
        <FeeRow label="전일권 (성인)" value={won(priceTiers.full.성인)} />
      )}
      {tiers.has('half') && (
        <FeeRow label="반일권 (성인)" value={won(priceTiers.half.성인)} />
      )}
      {pass && (
        <FeeRow label="월 정기권 (성인)" value={`${won(pass.성인)}~`} />
      )}
      <p className="text-xs text-text-sub">
        ✓ {dayjs(pool.updatedAt).format('YYYY.MM.DD')} 갱신 · {pool.operator}
      </p>
    </section>
  );
}

function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-mute">{label}</span>
      <span className="font-bold text-text">{value}</span>
    </div>
  );
}
