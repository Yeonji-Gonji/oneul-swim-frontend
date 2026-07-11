'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ADMIN_TOKEN_KEY,
  type AdminRequest,
  kakaoAuthorizeUrl,
} from '@/lib/admin-api';
import { ReportsSection } from '@/components/admin/ReportsSection';
import { PoolsSection } from '@/components/admin/PoolsSection';
import { FreshnessSection } from '@/components/admin/FreshnessSection';
import { AnnounceSection } from '@/components/admin/AnnounceSection';
import { ScheduleDraftsSection } from '@/components/admin/ScheduleDraftsSection';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const KAKAO_REST_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_KEY;

type Tab = 'drafts' | 'reports' | 'pools' | 'freshness' | 'announce';

const TABS: { key: Tab; label: string }[] = [
  { key: 'drafts', label: '시간표 초안' },
  { key: 'reports', label: '제보 관리' },
  { key: 'pools', label: '데이터 수정' },
  { key: 'freshness', label: '신선도 알림' },
  { key: 'announce', label: '접수 소식' },
];

/** authorize 와 token 교환에서 동일해야 하는 redirect_uri */
const redirectUri = (): string => `${window.location.origin}/admin`;

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<Tab>('drafts');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [exchanging, setExchanging] = useState(false);

  // 마운트 후: 저장된 토큰 복원 + 카카오 redirect(?code=) 처리
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (saved) {
      setToken(saved);
      setReady(true);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && API_URL) {
      setExchanging(true);
      fetch(`${API_URL}/admin/auth/kakao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: redirectUri() }),
      })
        .then(async (res) => {
          if (res.status === 403) throw new Error('forbidden');
          if (!res.ok) throw new Error('failed');
          const { token: adminToken } = (await res.json()) as { token: string };
          sessionStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
          setToken(adminToken);
          // 주소창에서 code 제거(새로고침 시 재사용 방지)
          window.history.replaceState({}, '', '/admin');
        })
        .catch((e: Error) => {
          setLoginError(
            e.message === 'forbidden'
              ? '승인 권한이 없는 카카오 계정이에요.'
              : '카카오 로그인에 실패했어요. 다시 시도해 주세요.',
          );
          window.history.replaceState({}, '', '/admin');
        })
        .finally(() => {
          setExchanging(false);
          setReady(true);
        });
      return;
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const loginWithKakao = () => {
    if (!KAKAO_REST_KEY) {
      setLoginError('카카오 로그인이 구성되지 않았어요(NEXT_PUBLIC_KAKAO_REST_KEY).');
      return;
    }
    window.location.href = kakaoAuthorizeUrl(KAKAO_REST_KEY, redirectUri());
  };

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

  // Bearer 주입 fetch. 401이면 토큰을 지우고 재로그인으로 되돌린다.
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
        <p className="text-sm text-text-sub">
          본인 카카오 계정으로 로그인하면 승인 권한이 부여돼요.
        </p>

        {loginError && <p className="text-sm text-error">{loginError}</p>}

        <button
          type="button"
          onClick={loginWithKakao}
          disabled={exchanging}
          className="rounded-button bg-[#FEE500] px-4 py-3 text-sm font-bold text-[#191600] disabled:opacity-50"
        >
          {exchanging ? '로그인 처리 중…' : '카카오로 로그인'}
        </button>

        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-text-sub">
            토큰으로 로그인(비상용)
          </summary>
          <div className="mt-2 flex flex-col gap-2">
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
              className="rounded-button border border-line px-4 py-2.5 text-sm font-bold text-text"
            >
              입력
            </button>
          </div>
        </details>
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
                ? 'border-primary bg-primary-fill text-white'
                : 'border-line bg-surface text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'drafts' && <ScheduleDraftsSection request={request} />}
      {tab === 'reports' && <ReportsSection request={request} />}
      {tab === 'pools' && <PoolsSection request={request} />}
      {tab === 'freshness' && <FreshnessSection request={request} />}
      {tab === 'announce' && <AnnounceSection request={request} />}
    </main>
  );
}
