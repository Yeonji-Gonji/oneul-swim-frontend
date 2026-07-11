'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { submitReport } from '@/lib/report-api';

type SendState = 'idle' | 'sending' | 'sent' | 'error';

/**
 * 앱 전반에 대한 의견 보내기 바텀시트. 제보 API를 재사용하되
 * poolId='app-feedback'으로 구분해 시설 제보와 섞이지 않게 한다.
 */
export function FeedbackSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [state, setState] = useState<SendState>('idle');

  if (!open) return null;

  const close = () => {
    setState('idle');
    setText('');
    onClose();
  };

  const send = async () => {
    if (!text.trim() || state === 'sending') return;
    setState('sending');
    const result = await submitReport({
      poolId: 'app-feedback',
      reason: '기타',
      content: text.trim(),
    });
    if (result.ok || result.reason === 'no-backend') setState('sent');
    else setState('error');
  };

  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-md flex-col justify-end">
      <button
        type="button"
        aria-label="닫기"
        onClick={close}
        className="animate-fade-in absolute inset-0 bg-black/40"
      />
      <div className="animate-sheet-up relative rounded-t-sheet bg-surface px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-sheet">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />

        {state === 'sent' ? (
          <div className="py-10 text-center">
            <p className="text-lg font-bold text-text">의견 감사합니다!</p>
            <p className="mt-2 text-sm text-text-sub">
              더 나은 오늘수영을 만드는 데 참고할게요.
            </p>
            <Button className="mt-6" onClick={close}>
              닫기
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-text">의견 보내기</h2>
            <p className="mt-2 text-sm text-text-sub">
              불편한 점, 있었으면 하는 기능을 자유롭게 적어주세요.
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              placeholder="예) 미사 말고 다른 지역도 추가해 주세요"
              className="mt-4 h-28 w-full resize-none rounded-input border border-line bg-bg p-3.5 text-sm text-text outline-none placeholder:text-text-sub focus:border-primary"
            />

            {state === 'error' && (
              <p className="mt-3 text-sm text-error">
                전송에 실패했어요. 잠시 후 다시 시도해 주세요.
              </p>
            )}

            <Button
              className="mt-4"
              disabled={!text.trim() || state === 'sending'}
              onClick={send}
            >
              {state === 'sending' ? '보내는 중…' : '보내기'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
