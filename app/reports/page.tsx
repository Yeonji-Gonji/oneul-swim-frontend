'use client';

import { useEffect, useState } from 'react';
import { pools } from '@/lib/pools';
import { dayjs } from '@/lib/time';
import { Header } from '@/components/layout/Header';
import { TabBar } from '@/components/layout/TabBar';
import { getDeviceId } from '@/lib/report-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface MyReport {
  id: string;
  poolId: string;
  reason: string;
  content: string;
  status: 'PENDING' | 'APPLIED' | 'REJECTED';
  createdAt: string;
  /** 어드민이 상태를 바꾼 시각(있으면 처리 시각으로 표시) */
  updatedAt?: string;
}

const STATUS_BADGE: Record<
  MyReport['status'],
  { label: string; className: string }
> = {
  PENDING: { label: '확인 중', className: 'bg-closed-soft text-closed-ink' },
  APPLIED: { label: '반영됨', className: 'bg-now-open-soft text-now-open-ink' },
  REJECTED: { label: '반영 불가', className: 'bg-closed-soft text-closed-ink' },
};

/** 처리 상태별 안내 한 줄 — 제보 루프가 닫혔음을 사용자에게 확인시킨다 */
const STATUS_HINT: Record<MyReport['status'], string> = {
  PENDING: '운영자가 확인하고 있어요.',
  APPLIED: '제보해 주신 내용이 정보에 반영됐어요. 감사합니다!',
  REJECTED: '확인 결과 반영하지 않았어요. 다른 제보는 언제든 환영해요.',
};

/** 시설명 표시: 앱 의견은 시설이 아니므로 별도 라벨 */
function poolLabel(poolId: string): string {
  if (poolId === 'app-feedback') return '앱 의견';
  return pools.find((p) => p.id === poolId)?.name ?? poolId;
}

/** 내 제보 내역 — 익명 deviceId 기준 최근 20건 */
export default function MyReportsPage() {
  const [reports, setReports] = useState<MyReport[] | null>(() =>
    API_URL ? null : [],
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/reports?deviceId=${getDeviceId()}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setReports)
      .catch(() => setError(true));
  }, []);

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 pb-24 pt-12">
        <Header variant="back" title="내 제보 내역" backHref="/more" />

        {error && (
          <p className="rounded-input bg-surface p-4 text-sm text-text-sub">
            내역을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {reports?.length === 0 && !error && (
          <div className="rounded-input bg-surface p-6 text-center">
            <p className="text-body font-bold text-text">
              아직 보낸 제보가 없어요
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-sub">
              시설 상세에서 잘못된 정보를 제보하면
              <br />이곳에서 처리 상태를 볼 수 있어요.
            </p>
          </div>
        )}

        {reports?.map((r) => {
          const badge = STATUS_BADGE[r.status];
          const applied = r.status === 'APPLIED';
          return (
            <div
              key={r.id}
              className={`flex flex-col gap-2 rounded-input bg-surface p-4 shadow-card ${
                applied ? 'ring-2 ring-now-open' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-body font-bold text-text">
                  {poolLabel(r.poolId)}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>
              <span className="text-[13px] text-text-sub">
                {r.reason}
                {r.content && ` · ${r.content}`}
              </span>
              <span
                className={`text-[13px] leading-relaxed ${
                  applied ? 'font-bold text-now-open-ink' : 'text-text-sub'
                }`}
              >
                {STATUS_HINT[r.status]}
              </span>
              <span className="text-xs text-text-sub">
                제보 {dayjs(r.createdAt).format('YYYY.MM.DD HH:mm')}
                {r.status !== 'PENDING' && r.updatedAt
                  ? ` · 처리 ${dayjs(r.updatedAt).format('YYYY.MM.DD HH:mm')}`
                  : ''}
              </span>
            </div>
          );
        })}

        {reports && reports.length > 0 && (
          <p className="text-xs leading-relaxed text-text-sub">
            제보 내역은 이 기기 기준으로 최근 20건까지 보여요. 브라우저
            데이터를 지우면 내역 연결이 끊어질 수 있어요.
          </p>
        )}
      </main>
      <TabBar active="more" />
    </>
  );
}
