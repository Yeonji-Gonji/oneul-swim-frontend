'use client';

import { useEffect, useState } from 'react';
import { pools } from '@/lib/pools';
import { formatWon } from '@/lib/format';
import { Toggle } from '@/components/ui/Toggle';
import { Header } from '@/components/layout/Header';
import { TabBar } from '@/components/layout/TabBar';

/**
 * 강습 등록일 알림 (Figma Lessons 5:89 바인딩).
 * ⚠️ 강습 '등록일(D-day)'은 검증 데이터에 없어(예약시스템 전용) 날조하지 않는다.
 *    실제 강습 정보로 카드를 채우고 등록일은 "시설 확인" 표기 + 알림 구독 토글 제공.
 *    구독/알림 상태는 localStorage에 저장된다 (등록일 데이터 확보 전까지의 v1.5).
 */
const STORAGE_KEY = 'oneul-swim:lesson-alerts';

function loadSaved(): { alerts: Record<string, boolean>; subs: Record<string, boolean> } {
  try {
    return {
      alerts: {},
      subs: {},
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'),
    };
  } catch {
    return { alerts: {}, subs: {} };
  }
}
export default function LessonsPage() {
  // 시설별 대표 강습 1개씩 (실데이터)
  const featured = pools
    .map((p) => (p.lessons[0] ? { pool: p, lesson: p.lessons[0] } : null))
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const [alerts, setAlerts] = useState<Record<string, boolean>>({});
  const [subs, setSubs] = useState<Record<string, boolean>>({});

  const [restored, setRestored] = useState(false);

  // 저장된 토글 상태를 먼저 복원하고, 그 이후의 변경만 저장한다
  useEffect(() => {
    const saved = loadSaved();
    // localStorage는 서버에 없어 lazy 초기화 시 하이드레이션 불일치가 나므로
    // 마운트 후 1회 복원이 의도된 패턴이다 (cascading render 아님)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlerts(saved.alerts);
    setSubs(saved.subs);
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ alerts, subs }));
  }, [restored, alerts, subs]);

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 pb-24 pt-12">
        <Header variant="title" title="강습 등록일 알림" />

        <p className="text-sm font-bold text-text-mute">강습 둘러보기</p>
        <div className="flex flex-col gap-3">
          {featured.map(({ pool, lesson }) => {
            const key = `${pool.id}-${lesson.name}`;
            return (
              <div
                key={key}
                className="flex flex-col gap-2.5 rounded-input bg-surface p-4 shadow-[1px_1px_4px_0px_rgba(0,0,0,0.12)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-body font-bold text-text">
                      {pool.name} {lesson.name}
                    </span>
                    <span className="text-[13px] text-text-sub">
                      {lesson.daysLabel} · 월 {formatWon(lesson.fee)}
                    </span>
                  </div>
                  <Toggle
                    on={!!alerts[key]}
                    onChange={(v) => setAlerts((s) => ({ ...s, [key]: v }))}
                    label={`${pool.name} ${lesson.name} 알림`}
                  />
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

        <p className="mt-2 text-sm font-bold text-text-mute">내가 구독한 시설</p>
        <div className="flex flex-col gap-2.5 rounded-input bg-surface p-4 shadow-[1px_1px_4px_0px_rgba(0,0,0,0.12)]">
          {pools.map((p, i) => (
            <div key={p.id}>
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-text">{p.name}</span>
                <Toggle
                  on={!!subs[p.id]}
                  onChange={(v) => setSubs((s) => ({ ...s, [p.id]: v }))}
                  label={`${p.name} 구독`}
                />
              </div>
              {i < pools.length - 1 && <div className="mt-2.5 h-px bg-line" />}
            </div>
          ))}
        </div>

        <p className="mt-1 text-xs leading-relaxed text-text-sub">
          강습 등록일 자동 알림은 준비 중이에요. 시설을 구독해두면 등록일이
          확인되는 대로 알려드릴게요.
        </p>
      </main>
      <TabBar active="lessons" />
    </>
  );
}
