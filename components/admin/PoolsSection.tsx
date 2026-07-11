'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  FreeSwimTier,
  Pool,
  PoolsData,
  PriceByTarget,
} from '@/lib/types';
import type { AdminRequest } from '@/lib/admin-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TARGETS: (keyof PriceByTarget)[] = [
  '성인',
  '청소년',
  '경로',
  '어린이',
  '장애유공자',
];
const EMPTY_TIERS: Record<FreeSwimTier, PriceByTarget> = {
  full: { 성인: 0, 청소년: 0, 경로: 0, 어린이: 0, 장애유공자: 0 },
  half: { 성인: 0, 청소년: 0, 경로: 0, 어린이: 0, 장애유공자: 0 },
};

/** 데이터 수정 — 시설 개별 필드(PATCH /admin/pools/:id) + 공통 요금표(PUT /admin/fees) */
export function PoolsSection({ request }: { request: AdminRequest }) {
  const [data, setData] = useState<PoolsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/pools`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError('현재 데이터를 불러오지 못했어요.');
    }
  }, []);

  useEffect(() => {
    // 마운트 시 현재 데이터를 불러오는 의도된 fetch 효과
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!data) return <p className="text-sm text-text-sub">불러오는 중…</p>;

  return (
    <section className="flex flex-col gap-6">
      <PoolEditor pools={data.pools} request={request} onSaved={load} />
      <FeesEditor
        tiers={data.freeSwimPriceTiers ?? EMPTY_TIERS}
        request={request}
        onSaved={load}
      />
    </section>
  );
}

/** 시설 선택 → notice/phone/laneInfo/updatedAt + freeSwim(JSON) 편집 */
function PoolEditor({
  pools,
  request,
  onSaved,
}: {
  pools: Pool[];
  request: AdminRequest;
  onSaved: () => void;
}) {
  const [id, setId] = useState(pools[0]?.id ?? '');
  const pool = pools.find((p) => p.id === id);
  const [notice, setNotice] = useState('');
  const [phone, setPhone] = useState('');
  const [laneInfo, setLaneInfo] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [freeSwimJson, setFreeSwimJson] = useState('');
  const [feesJson, setFeesJson] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 선택 시설이 바뀌면 폼을 현재 값으로 리셋 (외부 데이터 → 폼 상태 동기화)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!pool) return;
    setNotice(pool.notice ?? '');
    setPhone(pool.phone ?? '');
    setLaneInfo(pool.laneInfo ?? '');
    setUpdatedAt(pool.updatedAt ?? '');
    setFreeSwimJson(JSON.stringify(pool.freeSwim ?? { sessions: [] }, null, 2));
    setFeesJson(JSON.stringify(pool.fees ?? null, null, 2));
    setMsg(null);
  }, [pool]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = async () => {
    setMsg(null);
    let freeSwim: Pool['freeSwim'];
    let fees: Pool['fees'];
    try {
      freeSwim = JSON.parse(freeSwimJson);
      fees = JSON.parse(feesJson);
    } catch {
      setMsg('freeSwim/fees JSON 형식이 올바르지 않아 저장하지 않았어요.');
      return;
    }
    setBusy(true);
    try {
      const res = await request(`/admin/pools/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          notice,
          phone,
          laneInfo,
          updatedAt,
          freeSwim,
          fees,
        }),
      });
      if (!res.ok) throw new Error();
      setMsg('저장했어요.');
      onSaved();
    } catch {
      setMsg('저장에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-input border border-line bg-surface p-4">
      <h2 className="font-bold text-text">시설 데이터</h2>

      <select
        value={id}
        onChange={(e) => setId(e.target.value)}
        className="rounded-input border border-line bg-bg p-2.5 text-sm text-text"
      >
        {pools.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <Field label="공지(notice)">
        <textarea
          value={notice}
          onChange={(e) => setNotice(e.target.value)}
          className="h-24 w-full resize-none rounded-input border border-line bg-bg p-2.5 text-sm text-text"
        />
      </Field>
      <Field label="전화(phone)">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-input border border-line bg-bg p-2.5 text-sm text-text"
        />
      </Field>
      <Field label="레인 정보(laneInfo)">
        <input
          value={laneInfo}
          onChange={(e) => setLaneInfo(e.target.value)}
          className="w-full rounded-input border border-line bg-bg p-2.5 text-sm text-text"
        />
      </Field>
      <Field label="갱신일(updatedAt, YYYY-MM-DD)">
        <input
          value={updatedAt}
          onChange={(e) => setUpdatedAt(e.target.value)}
          className="w-full rounded-input border border-line bg-bg p-2.5 text-sm text-text"
        />
      </Field>
      <Field label="자유수영(freeSwim, JSON)">
        <textarea
          value={freeSwimJson}
          onChange={(e) => setFreeSwimJson(e.target.value)}
          className="h-48 w-full resize-none rounded-input border border-line bg-bg p-2.5 font-mono text-xs text-text"
        />
      </Field>
      <Field label="요금표(fees, JSON — 시설별. 없으면 null)">
        <textarea
          value={feesJson}
          onChange={(e) => setFeesJson(e.target.value)}
          className="h-40 w-full resize-none rounded-input border border-line bg-bg p-2.5 font-mono text-xs text-text"
        />
      </Field>

      {msg && <p className="text-sm text-text-sub">{msg}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="rounded-button bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? '저장 중…' : '시설 저장'}
      </button>
    </div>
  );
}

/** 공통 자유수영 요금표 편집 → PUT /admin/fees */
function FeesEditor({
  tiers,
  request,
  onSaved,
}: {
  tiers: Record<FreeSwimTier, PriceByTarget>;
  request: AdminRequest;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Record<FreeSwimTier, PriceByTarget>>(tiers);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // 최신 요금표(외부 데이터)를 폼 초안에 반영
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(tiers);
  }, [tiers]);

  const setVal = (
    tier: FreeSwimTier,
    target: keyof PriceByTarget,
    value: number,
  ) =>
    setDraft((d) => ({ ...d, [tier]: { ...d[tier], [target]: value } }));

  const save = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const res = await request('/admin/fees', {
        method: 'PUT',
        body: JSON.stringify({ tiers: draft }),
      });
      if (!res.ok) throw new Error();
      setMsg('요금표를 저장했어요.');
      onSaved();
    } catch {
      setMsg('저장에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-input border border-line bg-surface p-4">
      <h2 className="font-bold text-text">공통 요금표(전일/반일)</h2>
      {(['full', 'half'] as const).map((tier) => (
        <div key={tier} className="flex flex-col gap-2">
          <span className="text-sm font-bold text-text">
            {tier === 'full' ? '전일권' : '반일권'}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {TARGETS.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <span className="w-16 shrink-0 text-text-sub">{t}</span>
                <input
                  type="number"
                  value={draft[tier][t]}
                  onChange={(e) => setVal(tier, t, Number(e.target.value))}
                  className="w-full rounded-input border border-line bg-bg p-2 text-sm text-text"
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      {msg && <p className="text-sm text-text-sub">{msg}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="rounded-button bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? '저장 중…' : '요금표 저장'}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-text-sub">{label}</span>
      {children}
    </label>
  );
}
