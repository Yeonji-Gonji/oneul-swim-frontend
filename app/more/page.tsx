'use client';

import { useState } from 'react';
import Link from 'next/link';
import { pools } from '@/lib/pools';
import { dayjs } from '@/lib/time';
import { Toggle } from '@/components/ui/Toggle';
import { Header } from '@/components/layout/Header';
import { TabBar } from '@/components/layout/TabBar';
import { IconChevronRight } from '@/components/ui/icons';

const MENU: { label: string; href?: string }[] = [
  { label: '내 제보 내역' },
  { label: '데이터 기준 안내' },
  { label: '의견 보내기' },
  { label: '개인정보처리방침', href: '/privacy' },
];

/** 더보기 (Figma More 5:134 바인딩) — 설정·메뉴·데이터 기준 안내 */
export default function MorePage() {
  const [morning, setMorning] = useState(false);
  const lastUpdated = pools
    .map((p) => p.updatedAt)
    .sort()
    .at(-1);

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 pb-24 pt-12">
        <Header variant="title" title="더보기" />

        {/* 설정 */}
        <div className="rounded-input bg-surface p-4 shadow-[1px_1px_4px_0px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-body text-text">오늘 자유수영 아침 요약</span>
              <span className="text-xs text-text-sub">매일 오전 8시 푸시</span>
            </div>
            <Toggle on={morning} onChange={setMorning} label="아침 요약 푸시" />
          </div>
        </div>

        {/* 메뉴 */}
        <div className="rounded-input bg-surface px-4 shadow-[1px_1px_4px_0px_rgba(0,0,0,0.12)]">
          {MENU.map(({ label, href }, i) => {
            const inner = (
              <>
                <span className="text-body text-text">{label}</span>
                <IconChevronRight className="size-5 text-text-sub" />
              </>
            );
            return (
              <div key={label}>
                {href ? (
                  <Link
                    href={href}
                    className="flex w-full items-center justify-between py-4 text-left"
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-4 text-left"
                  >
                    {inner}
                  </button>
                )}
                {i < MENU.length - 1 && <div className="h-px bg-line" />}
              </div>
            );
          })}
        </div>

        {/* 데이터 기준 안내 */}
        <div className="rounded-input bg-surface p-4 shadow-[1px_1px_4px_0px_rgba(0,0,0,0.12)]">
          <h2 className="text-sm font-bold text-text">데이터는 이렇게 관리해요</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-text-sub">
            시간표·요금은 하남도시공사 공식 페이지 기준이며 운영자가 주기적으로
            점검합니다. 분기·시즌마다 바뀔 수 있으니 방문 전 전화 확인을
            권장해요.
          </p>
          <p className="mt-3 text-xs text-text-sub">
            마지막 갱신 {lastUpdated && dayjs(lastUpdated).format('YYYY.MM.DD')} ·
            공공 {pools.length}곳
          </p>
        </div>
      </main>
      <TabBar active="more" />
    </>
  );
}
