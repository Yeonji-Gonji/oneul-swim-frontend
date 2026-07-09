'use client';

import { useCallback, useEffect, useState } from 'react';
import { dayjs } from '@/lib/time';
import type { AdminRequest, FreshnessAlert } from '@/lib/admin-api';

/** 신선도 알림 — 원본 페이지 변경 감지 목록. 확인 후 "처리됨"으로 해소 */
export function FreshnessSection({ request }: { request: AdminRequest }) {
  const [alerts, setAlerts] = useState<FreshnessAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await request('/admin/freshness?resolved=false');
      if (!res.ok) throw new Error();
      setAlerts(await res.json());
    } catch {
      setError('목록을 불러오지 못했어요.');
    }
  }, [request]);

  useEffect(() => {
    // 마운트 시 목록을 불러오는 의도된 fetch 효과
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const resolve = async (id: string) => {
    setBusyId(id);
    try {
      const res = await request(`/admin/freshness/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ resolved: true }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError('처리에 실패했어요.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {alerts.length === 0 && !error && (
        <p className="rounded-input bg-surface p-4 text-sm text-text-sub">
          미처리 신선도 알림이 없어요.
        </p>
      )}
      {alerts.map((a) => (
        <div
          key={a.id}
          className="flex flex-col gap-2 rounded-input border border-line bg-surface p-4"
        >
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sm font-bold text-primary underline"
          >
            {a.url}
          </a>
          <span className="text-xs text-text-sub">
            감지 {dayjs(a.detectedAt).format('YYYY.MM.DD HH:mm')}
          </span>
          <button
            type="button"
            disabled={busyId === a.id}
            onClick={() => resolve(a.id)}
            className="w-fit rounded-button border border-primary px-3 py-1.5 text-xs font-bold text-primary disabled:opacity-50"
          >
            처리됨
          </button>
        </div>
      ))}
    </section>
  );
}
