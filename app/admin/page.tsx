'use client';

import { useCallback, useEffect, useState } from 'react';
import { ADMIN_TOKEN_KEY, type AdminRequest } from '@/lib/admin-api';
import { ReportsSection } from '@/components/admin/ReportsSection';
import { PoolsSection } from '@/components/admin/PoolsSection';
import { FreshnessSection } from '@/components/admin/FreshnessSection';
import { AnnounceSection } from '@/components/admin/AnnounceSection';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Tab = 'reports' | 'pools' | 'freshness' | 'announce';

const TABS: { key: Tab; label: string }[] = [
  { key: 'reports', label: '제보 관리' },
  { key: 'pools', label: '데이터 수정' },
  { key: 'freshness', label: '신선도 알림' },
  { key: 'announce', label: '접수 소식' },
];

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<Tab>('reports');

  // 마운트 후 저장된 토큰 복원(SSR 불일치 방지) — sessionStorage 접근은 효과에서만 가능
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setToken(sessionStorage.getItem(ADMIN_TOKEN_KEY));
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveToken = () => {
    const t = input.trim();
    if (!t) return;
    sessionStorage.setItem(ADMIN_TOKEN_KEY, t);
    setToken(t);
    setInput('');
  };

  const clearToken = useCallback(() => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
  }, []);

  // Bearer 주입 fetch. 401이면 토큰을 지우고 재로그인 폼으로 되돌린다.
  const request = useCallback<AdminRequest>(
    async (path, init) => {
      const res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
          ...(init?.headers ?? {}),
        },
      });
      if (res.status === 401) {
        clearToken();
        throw new Error('unauthorized');
      }
      return res;
    },
    [token, clearToken],
  );

  if (!API_URL) {
    return (
      <main className="mx-auto w-full max-w-md px-6 py-16">
        <h1 className="text-lg font-bold text-text">오늘수영 어드민</h1>
        <p className="mt-4 text-sm text-text-sub">
          API가 설정되지 않았어요(NEXT_PUBLIC_API_URL). 서버 연결 후 이용할 수
          있어요.
        </p>
      </main>
    );
  }

  if (!ready) return null;

  if (!token) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-16">
        <h1 className="text-lg font-bold text-text">오늘수영 어드민</h1>
        <p className="text-sm text-text-sub">운영 토큰을 입력하세요.</p>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && saveToken()}
          placeholder="ADMIN_TOKEN"
          className="w-full rounded-input border border-line bg-bg p-3 text-sm text-text"
        />
        <button
          type="button"
          onClick={saveToken}
          className="rounded-button bg-primary px-4 py-3 text-sm font-bold text-white"
        >
          입력
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text">오늘수영 어드민</h1>
        <button
          type="button"
          onClick={clearToken}
          className="text-xs text-text-sub underline"
        >
          로그아웃
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              tab === t.key
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-surface text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reports' && <ReportsSection request={request} />}
      {tab === 'pools' && <PoolsSection request={request} />}
      {tab === 'freshness' && <FreshnessSection request={request} />}
      {tab === 'announce' && <AnnounceSection request={request} />}
    </main>
  );
}
