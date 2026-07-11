import type { Pool } from '@/lib/types';
import { dayjs } from '@/lib/time';
import { formatWon as won } from '@/lib/format';

/** 자유수영 이용권 요금 카드. 요금은 시설별 pool.fees 를 읽는다. */
export function FeeCard({ pool }: { pool: Pool }) {
  const fees = pool.fees;
  const sessions = pool.freeSwim?.sessions ?? [];
  const tiers = new Set(sessions.map((s) => s.tier));
  const pass = pool.freeSwim?.monthlyPass;
  const fullAdult = fees?.full?.성인;
  const halfAdult = fees?.half?.성인;

  // 요금 정보가 아예 없으면 준비중 안내
  if (!fees || (fullAdult == null && halfAdult == null)) {
    return (
      <section className="flex w-full flex-col gap-2.5 rounded-input bg-surface p-4 shadow-card">
        <h2 className="text-body font-bold text-text">자유수영 이용권</h2>
        <p className="text-sm text-text-sub">
          요금 정보가 아직 준비되지 않았어요. 아시는 정보가 있다면 제보해 주세요.
        </p>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col gap-2.5 rounded-input bg-surface p-4 shadow-card">
      <h2 className="text-body font-bold text-text">자유수영 이용권</h2>
      {tiers.has('full') && fullAdult != null && (
        <FeeRow label="전일권 (성인)" value={won(fullAdult)} />
      )}
      {tiers.has('half') && halfAdult != null && (
        <FeeRow label="반일권 (성인)" value={won(halfAdult)} />
      )}
      {pass && <FeeRow label="월 정기권 (성인)" value={`${won(pass.성인)}~`} />}
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
