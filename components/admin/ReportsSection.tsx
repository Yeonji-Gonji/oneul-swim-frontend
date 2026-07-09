'use client';

import { useCallback, useEffect, useState } from 'react';
import { pools } from '@/lib/pools';
import { dayjs } from '@/lib/time';
import {
  type AdminReport,
  type AdminRequest,
  REPORT_STATUSES,
  STATUS_LABEL,
} from '@/lib/admin-api';

type Filter = AdminReport['status'] | 'ALL';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'PENDING', label: '확인 중' },
  { key: 'APPLIED', label: '반영됨' },
  { key: 'REJECTED', label: '반영 불가' },
];

function poolLabel(poolId: string): string {
  if (poolId === 'app-feedback') return '앱 의견';
  return pools.find((p) => p.id === poolId)?.name ?? poolId;
}

/** 제보 관리 — 상태 필터 + 상태 변경 (제보→어드민 처리 루프의 어드민측) */
export function ReportsSection({ request }: { request: AdminRequest }) {
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const qs = filter === 'ALL' ? '' : `?status=${filter}`;
      const res = await request(`/admin/reports${qs}`);
      if (!res.ok) throw new Error();
      setReports(await res.json());
    } catch {
      setError('목록을 불러오지 못했어요.');
    }
  }, [filter, request]);

  useEffect(() => {
    // 마운트/필터 변경 시 목록을 다시 불러오는 의도된 fetch 효과
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const changeStatus = async (id: string, status: AdminReport['status']) => {
    setBusyId(id);
    try {
      const res = await request(`/admin/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError('상태 변경에 실패했어요.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              filter === f.key
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-surface text-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {reports.length === 0 && !error && (
        <p className="rounded-input bg-surface p-4 text-sm text-text-sub">
          해당 상태의 제보가 없어요.
        </p>
      )}

      {reports.map((r) => (
        <div
          key={r.id}
          className="flex flex-col gap-2 rounded-input border border-line bg-surface p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="font-bold text-text">{poolLabel(r.poolId)}</span>
            <span className="shrink-0 rounded-full bg-bg px-2.5 py-1 text-xs font-bold text-text-sub">
              {STATUS_LABEL[r.status]}
            </span>
          </div>
          <span className="text-[13px] text-text-sub">
            {r.reason}
            {r.content && ` · ${r.content}`}
          </span>
          <span className="text-xs text-text-sub">
            {dayjs(r.createdAt).format('YYYY.MM.DD HH:mm')}
          </span>
          <div className="mt-1 flex flex-wrap gap-2">
            {REPORT_STATUSES.filter((s) => s !== r.status).map((s) => (
              <button
                key={s}
                type="button"
                disabled={busyId === r.id}
                onClick={() => changeStatus(r.id, s)}
                className="rounded-button border border-primary px-3 py-1.5 text-xs font-bold text-primary disabled:opacity-50"
              >
                {STATUS_LABEL[s]}(으)로
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
