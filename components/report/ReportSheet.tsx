'use client';

import { useState } from 'react';
import { buttonClass, Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { IconFlag, IconCamera } from '@/components/ui/icons';
import { submitReport } from '@/lib/report-api';

/** 백엔드 CreateReportDto의 REPORT_REASONS와 동일해야 한다 */
const REASONS = ['자유수영 시간', '요금', '휴관/임시변경', '기타'];

type SendState = 'idle' | 'sending' | 'sent' | 'error';

/**
 * "정보 틀렸어요 제보" 트리거 + BottomSheet (Figma Report 19:129 바인딩).
 * oneul-swim-api로 전송하되, 백엔드 미설정/장애 시에도 접수 UX는 유지한다
 * (no-backend는 성공으로 처리 — 정적 MVP 시절과 동일한 동작).
 */
export function ReportSheet({
  poolId,
  poolName,
}: {
  poolId: string;
  poolName: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [state, setState] = useState<SendState>('idle');

  const close = () => {
    setOpen(false);
    setState('idle');
    setReason(null);
    setText('');
  };

  const send = async () => {
    if (!reason || state === 'sending') return;
    setState('sending');
    const result = await submitReport({ poolId, reason, content: text });
    if (result.ok || result.reason === 'no-backend') {
      setState('sent');
    } else {
      setState('error');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass('outline')}
      >
        <IconFlag className="size-[18px]" />
        정보 틀렸어요 제보
      </button>

      {open && (
        <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-md flex-col justify-end">
          <button
            type="button"
            aria-label="닫기"
            onClick={close}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative rounded-t-sheet bg-surface px-5 pb-6 pt-3">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />

            {state === 'sent' ? (
              <div className="py-10 text-center">
                <p className="text-lg font-bold text-text">제보 감사합니다!</p>
                <p className="mt-2 text-sm text-text-sub">
                  확인 후 정보에 반영할게요.
                </p>
                <Button className="mt-6" onClick={close}>
                  닫기
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-text">
                  정보 틀렸어요 제보
                </h2>
                <p className="mt-2 text-sm text-text-sub">{poolName}</p>

                <p className="mt-4 text-sm font-medium text-text">
                  무엇이 다른가요?
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {REASONS.map((r) => (
                    <Chip
                      key={r}
                      selected={reason === r}
                      onClick={() => setReason(r)}
                    >
                      {r}
                    </Chip>
                  ))}
                </div>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={500}
                  placeholder="예) 토요일 16:00 자유수영이 없어졌어요"
                  className="mt-4 h-20 w-full resize-none rounded-input border border-line bg-bg p-3.5 text-sm text-text outline-none placeholder:text-text-sub focus:border-primary"
                />

                <label className="mt-3 flex cursor-pointer items-center justify-center gap-1.5 rounded-input border border-line bg-bg py-4 text-sm text-text-sub">
                  <IconCamera className="size-[18px]" />
                  사진 첨부 (선택)
                  <input type="file" accept="image/*" className="hidden" />
                </label>

                {state === 'error' && (
                  <p className="mt-3 text-sm text-red-500">
                    전송에 실패했어요. 잠시 후 다시 시도해 주세요.
                  </p>
                )}

                <Button
                  className="mt-4"
                  disabled={!reason || state === 'sending'}
                  onClick={send}
                >
                  {state === 'sending' ? '보내는 중…' : '제보 보내기'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
