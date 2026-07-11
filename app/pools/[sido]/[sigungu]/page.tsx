import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { TabBar } from '@/components/layout/TabBar';
import { PoolCard } from '@/components/home/PoolCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { getPoolsList } from '@/lib/pools-data';
import { listSidos, listSigungus, poolsInSigungu } from '@/lib/regions';
import { sortPoolsByStatus } from '@/lib/pools';
import { nowInSeoul } from '@/lib/time';

// 지역 목록만 반영하면 되므로 ISR(1시간).
export const revalidate = 3600;

export async function generateStaticParams() {
  const pools = await getPoolsList();
  // 모든 (sido, sigungu) 쌍. 한글 세그먼트 그대로 — Next가 인코딩 처리.
  return listSidos(pools).flatMap(({ sido }) =>
    listSigungus(pools, sido).map(({ sigungu }) => ({ sido, sigungu })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sido: string; sigungu: string }>;
}): Promise<Metadata> {
  const { sido: rawSido, sigungu: rawSigungu } = await params;
  const sido = decodeURIComponent(rawSido);
  const sigungu = decodeURIComponent(rawSigungu);
  const pools = await getPoolsList();
  const count = poolsInSigungu(pools, sido, sigungu).length;

  return {
    title: `${sigungu} 자유수영장 | ${sido}`,
    description: `${sido} ${sigungu}에서 지금 자유수영 가능한 수영장 ${count}곳을 시간표·요금과 함께 확인하세요.`,
    alternates: {
      canonical: `/pools/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`,
    },
  };
}

export default async function SigunguPage({
  params,
}: {
  params: Promise<{ sido: string; sigungu: string }>;
}) {
  const { sido: rawSido, sigungu: rawSigungu } = await params;
  const sido = decodeURIComponent(rawSido);
  const sigungu = decodeURIComponent(rawSigungu);
  const pools = await getPoolsList();

  const inSigungu = poolsInSigungu(pools, sido, sigungu);
  if (inSigungu.length === 0) notFound();

  const now = nowInSeoul();
  const sorted = sortPoolsByStatus(inSigungu, now);

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${sigungu}에서 지금 자유수영 갈 수 있나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${sido} ${sigungu}에는 자유수영을 운영하는 공공 수영장 ${inSigungu.length}곳이 있습니다. 오늘수영에서 지금 이 시간 자유수영이 가능한 곳과 요일별 시간표, 요금을 확인할 수 있어요.`,
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={faq} />
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 pb-24 pt-12">
        <Header
          variant="back"
          title={`${sigungu} 자유수영장`}
          backHref={`/pools/${encodeURIComponent(sido)}`}
        />

        {/* 답변형 요약(GEO) */}
        <p className="text-sm leading-relaxed text-text-sub">
          {sido} {sigungu}에는 공공 수영장 {inSigungu.length}곳이 있습니다.
          아래에서 오늘 자유수영 시간과 요금을 확인하세요.
        </p>

        <div className="flex flex-col gap-3">
          {sorted.map((pool) => (
            <PoolCard key={pool.id} pool={pool} now={now} />
          ))}
        </div>
      </main>
      <TabBar active="home" />
    </>
  );
}
