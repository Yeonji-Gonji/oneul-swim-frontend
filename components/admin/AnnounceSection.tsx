'use client';

import { useState } from 'react';
import type { AdminRequest } from '@/lib/admin-api';

/** 강습 접수 소식 보내기 — 강습 구독자 전체 푸시(POST /admin/announce) */
export function AnnounceSection({ request }: { request: AdminRequest }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!title.trim() || !body.trim() || busy) return;
    setResult(null);
    setBusy(true);
    try {
      const res = await request('/admin/announce', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json().catch(() => ({}))) as {
        sent?: number;
        failed?: number;
      };
      setResult(
        `발송 완료 — 성공 ${data.sent ?? '?'}건 · 실패 ${data.failed ?? '?'}건`,
      );
      setTitle('');
      setBody('');
    } catch {
      setResult('발송에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-input border border-line bg-surface p-4">
      <p className="text-sm text-text-sub">
        강습 접수 소식 알림을 구독한 사용자 전체에게 푸시를 보냅니다.
      </p>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-text-sub">제목</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 미사 여름 강습 접수 시작"
          className="w-full rounded-input border border-line bg-bg p-2.5 text-sm text-text"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-text-sub">내용</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="예) 7/15 오전 10시부터 홈페이지에서 접수하세요."
          className="h-24 w-full resize-none rounded-input border border-line bg-bg p-2.5 text-sm text-text"
        />
      </label>
      {result && <p className="text-sm text-text-sub">{result}</p>}
      <button
        type="button"
        disabled={busy || !title.trim() || !body.trim()}
        onClick={send}
        className="rounded-button bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? '보내는 중…' : '전체 발송'}
      </button>
    </section>
  );
}
