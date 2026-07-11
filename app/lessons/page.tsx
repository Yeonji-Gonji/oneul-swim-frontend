'use client';

import { useEffect, useState } from 'react';
import { pools } from '@/lib/pools';
import { formatWon } from '@/lib/format';
import { Toggle } from '@/components/ui/Toggle';
import { Header } from '@/components/layout/Header';
import { TabBar } from '@/components/layout/TabBar';
import {
  disableLessonPush,
  enableLessonPush,
  getLessonPushEnabled,
  isPushSupported,
} from '@/lib/push';

/**
 * 강습 접수 소식 알림 (Figma Lessons 5:89 바인딩).
 * ⚠️ 강습 '등록일(D-day)'은 검증 데이터에 없어(예약시스템 전용) 날조하지 않는다.
 *    실제 강습 정보로 카드를 채우고 등록일은 "시설 확인" 표기.
 *    알림은 시설별 localStorage 토글(반쪽 기능)을 걷어내고, 접수 소식이 열리면
 *    운영자가 전체 발송하는 단일 서버구독 토글로 승격했다(more의 아침요약과 동일 패턴).
 */
const LEGACY_STORAGE_KEY = 'oneul-swim:lesson-alerts';

const PUSH_ERROR_MESSAGE: Record<string, string> = {
  unsupported: '이 브라우저는 푸시 알림을 지원하지 않아요.',
  denied: '알림 권한이 꺼져 있어요. 브라우저 설정에서 허용해 주세요.',
  'no-backend': '알림 서버 준비 중이에요. 잠시 후 다시 시도해 주세요.',
  network: '설정에 실패했어요. 잠시 후 다시 시도해 주세요.',
};

export default function LessonsPage() {
  // 시설별 대표 강습 1개씩 (실데이터)
  const featured = pools
    .map((p) => {
      const firstLesson = p.lessons?.[0];
      return firstLesson ? { pool: p, lesson: firstLesson } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const [subscribed, setSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  // 서버구독 여부(로컬 플래그+브라우저 구독)를 마운트 후 복원.
  // 겸사겸사 옛 시설별 localStorage 잔재를 정리한다.
  useEffect(() => {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    getLessonPushEnabled().then(setSubscribed);
  }, []);

  const toggleSubscription = async (next: boolean) => {
    if (pushBusy) return;
    setPushBusy(true);
    setPushError(null);
    const result = next ? await enableLessonPush() : await disableLessonPush();
    if (result.ok) {
      setSubscribed(next);
    } else {
      setPushError(PUSH_ERROR_MESSAGE[result.reason]);
    }
    setPushBusy(false);
  };

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 pb-24 pt-12">
        <Header variant="title" title="강습 접수 소식 알림" />

        {/* 단일 서버구독 토글 — 접수 소식이 열리면 운영자가 전체 발송 */}
        <div className="rounded-input bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-body text-text">
                강습 접수 소식 알림 받기
              </span>
              <span className="text-xs text-text-sub">
                새 강습 접수가 열리면 푸시로 알려드려요
              </span>
            </div>
            <Toggle
              on={subscribed}
              onChange={toggleSubscription}
              label="강습 접수 소식 알림"
            />
          </div>
          {pushError && (
            <p className="mt-3 text-xs leading-relaxed text-error">
              {pushError}
            </p>
          )}
          {!isPushSupported() && !pushError && (
            <p className="mt-3 text-xs leading-relaxed text-text-sub">
              iOS는 홈 화면에 추가한 앱에서만 알림을 받을 수 있어요.
            </p>
          )}
        </div>

        <p className="text-sm font-bold text-text-mute">강습 둘러보기</p>
        <div className="flex flex-col gap-3">
          {featured.map(({ pool, lesson }) => {
            const key = `${pool.id}-${lesson.name}`;
            return (
              <div
                key={key}
                className="flex flex-col gap-2.5 rounded-input bg-surface p-4 shadow-card"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-body font-bold text-text">
                    {pool.name} {lesson.name}
                  </span>
                  <span className="text-[13px] text-text-sub">
                    {lesson.daysLabel} · 월 {formatWon(lesson.fee)}
                  </span>
                </div>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-closed-soft px-2.5 py-1">
                  <span className="size-2 rounded-full bg-closed" aria-hidden />
                  <span className="text-xs font-bold text-closed-ink">
                    등록일 시설 확인
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-1 text-xs leading-relaxed text-text-sub">
          강습 등록일은 시설 예약시스템에서만 확정돼요. 접수가 열리는 소식이
          확인되는 대로 알림으로 알려드릴게요.
        </p>
      </main>
      <TabBar active="lessons" />
    </>
  );
}
