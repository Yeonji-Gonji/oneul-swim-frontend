'use client';

import { useCallback, useEffect, useState } from 'react';
import { dayjs } from '@/lib/time';
import {
  type AdminRequest,
  type DraftSession,
  DRAFT_STATUS_LABEL,
  type ScheduleDraft,
} from '@/lib/admin-api';

type Filter = ScheduleDraft['status'];

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'PENDING', label: '검수 대기' },
  { key: 'APPROVED', label: '승인됨' },
  { key: 'REJECTED', label: '반려됨' },
];

const CONFIDENCE_LABEL: Record<ScheduleDraft['confidence'], string> = {
  high: '신뢰 높음',
  medium: '신뢰 보통',
  low: '신뢰 낮음',
};

function sessionText(s: DraftSession): string {
  const weeks = s.weeksOfMonth?.length ? ` (${s.weeksOfMonth.join('·')}주)` : '';
  const tier = s.tier === 'half' ? '반값' : '정상';
  return `${s.daysLabel} ${s.start}~${s.end}${weeks} · ${tier}`;
}

/**
 * 시간표 AI 초안 검수 — enrich 스크립트가 쌓은 ScheduleDraft 를 승인/반려한다.
 * 승인 시 백엔드가 Pool.freeSwim 에 반영(+dataStatus full). 잘못된 초안은 반려.
 */
export function ScheduleDraftsSection({ request }: { request: AdminRequest }) {
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [drafts, setDrafts] = useState<ScheduleDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openSource, setOpenSource] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await request(`/admin/schedule-drafts?status=${filter}`);
      if (!res.ok) throw new Error();
      setDrafts(await res.json());
    } catch {
      setError('초안 목록을 불러오지 못했어요.');
    }
  }, [filter, request]);

  useEffect(() => {
    // 마운트/필터 변경 시 목록 재조회
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    setError(null);
    try {
      const res = await request(`/admin/schedule-drafts/${id}/${action}`, {
        method: 'POST',
      });
      if (res.status === 403) {
        setError('승인 권한이 없는 계정이에요. 본인 계정으로 로그인했는지 확인해 주세요.');
        return;
      }
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError(action === 'approve' ? '승인에 실패했어요.' : '반려에 실패했어요.');
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

      <p className="text-xs text-text-sub">
        AI가 검색으로 만든 초안이에요. 시간이 맞는지 근거를 확인하고 승인하세요. 승인해야 앱에
        노출됩니다.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {drafts.length === 0 && !error && (
        <p className="rounded-input bg-surface p-4 text-sm text-text-sub">
          해당 상태의 초안이 없어요.
        </p>
      )}

      {drafts.map((d) => (
        <div
          key={d.id}
          className="flex flex-col gap-2 rounded-input border border-line bg-surface p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="font-bold text-text">{d.poolName}</span>
            <span className="shrink-0 rounded-full bg-bg px-2.5 py-1 text-xs font-bold text-text-sub">
              {d.status === 'PENDING'
                ? CONFIDENCE_LABEL[d.confidence]
                : DRAFT_STATUS_LABEL[d.status]}
            </span>
          </div>

          <ul className="flex flex-col gap-1">
            {d.sessions.map((s, i) => (
              <li key={i} className="text-[13px] text-text">
                · {sessionText(s)}
              </li>
            ))}
          </ul>

          {d.laneInfo && (
            <span className="text-xs text-text-sub">레인: {d.laneInfo}</span>
          )}
          {d.notice && (
            <span className="text-xs text-text-sub">유의: {d.notice}</span>
          )}

          <button
            type="button"
            onClick={() => setOpenSource(openSource === d.id ? null : d.id)}
            className="w-fit text-xs text-primary underline"
          >
            {openSource === d.id ? '근거 숨기기' : '근거(검색 스니펫) 보기'}
          </button>
          {openSource === d.id && (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-input bg-bg p-3 text-[11px] leading-relaxed text-text-sub">
              {d.sourceQuery}
              {'\n\n'}
              {d.sourceContext}
            </pre>
          )}

          <span className="text-xs text-text-sub">
            {dayjs(d.createdAt).format('YYYY.MM.DD HH:mm')}
          </span>

          {d.status === 'PENDING' && (
            <div className="mt-1 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === d.id}
                onClick={() => act(d.id, 'approve')}
                className="rounded-button bg-primary px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                승인 · 앱 반영
              </button>
              <button
                type="button"
                disabled={busyId === d.id}
                onClick={() => act(d.id, 'reject')}
                className="rounded-button border border-line px-4 py-1.5 text-xs font-bold text-text-sub disabled:opacity-50"
              >
                반려
              </button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
