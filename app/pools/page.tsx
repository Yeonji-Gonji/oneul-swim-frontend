import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { TabBar } from '@/components/layout/TabBar';
import { getPoolsList } from '@/lib/pools-data';
import { listSidos } from '@/lib/regions';

// 지역 인덱스는 시설 목록만 반영하면 되므로 ISR(1시간)로 정적 제공한다.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: '전국 자유수영장 지역별 찾기',
  description:
    '전국 공공 수영장의 자유수영 시간표와 요금을 지역(시도·시군구)별로 찾아보세요. 지금 이 시간 자유수영 가능한 곳을 한눈에 확인할 수 있어요.',
  alternates: { canonical: '/pools' },
};

export default async function PoolsIndexPage() {
  const pools = await getPoolsList();
  const sidos = listSidos(pools);
  const total = sidos.reduce((sum, s) => sum + s.count, 0);

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 pb-24 pt-12">
        <Header variant="title" title="지역별 자유수영장" />

        {/* 답변형 요약(GEO): 검색·AI 인용용 한두 문장 */}
        <p className="text-sm leading-relaxed text-text-sub">
          전국 공공 수영장 {total}곳의 자유수영 정보를 지역별로 모았어요. 아래에서
          시도를 골라 오늘 자유수영 시간과 요금을 확인하세요.
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {sidos.map(({ sido, count }) => (
            <Link
              key={sido}
              href={`/pools/${encodeURIComponent(sido)}`}
              className="flex items-center justify-between rounded-input bg-surface px-4 py-3.5 shadow-[1px_1px_4px_0px_rgba(0,0,0,0.12)] transition active:scale-[0.99]"
            >
              <span className="text-body font-bold text-text">{sido}</span>
              <span className="shrink-0 text-sm text-text-sub">{count}곳</span>
            </Link>
          ))}
        </div>
      </main>
      <TabBar active="home" />
    </>
  );
}
