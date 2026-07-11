import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { TabBar } from '@/components/layout/TabBar';
import { PoolCard } from '@/components/home/PoolCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { getPoolsList } from '@/lib/pools-data';
import { listSidos, listSigungus, poolsInSido } from '@/lib/regions';
import { sortPoolsByStatus } from '@/lib/pools';
import { nowInSeoul } from '@/lib/time';

// 지역 목록만 반영하면 되므로 ISR(1시간).
export const revalidate = 3600;

export async function generateStaticParams() {
  const pools = await getPoolsList();
  // 한글 세그먼트 그대로 반환 — Next가 인코딩을 처리한다.
  return listSidos(pools).map(({ sido }) => ({ sido }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sido: string }>;
}): Promise<Metadata> {
  const { sido: raw } = await params;
  const sido = decodeURIComponent(raw);
  const pools = await getPoolsList();
  const count = poolsInSido(pools, sido).length;

  return {
    title: `${sido} 자유수영장`,
    description: `${sido}에서 지금 자유수영 가능한 수영장 ${count}곳을 시간표·요금과 함께 확인하세요.`,
    alternates: { canonical: `/pools/${encodeURIComponent(sido)}` },
  };
}

export default async function SidoPage({
  params,
}: {
  params: Promise<{ sido: string }>;
}) {
  const { sido: raw } = await params;
  const sido = decodeURIComponent(raw);
  const pools = await getPoolsList();

  const inSido = poolsInSido(pools, sido);
  if (inSido.length === 0) notFound();

  const now = nowInSeoul();
  const sorted = sortPoolsByStatus(inSido, now);
  const sigungus = listSigungus(pools, sido);

  // GEO: 지역 페이지 1건 FAQPage — "지금 갈 수 있나요" 질문에 답변형으로 대응.
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${sido}에서 지금 자유수영 갈 수 있나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${sido}에는 자유수영을 운영하는 공공 수영장 ${inSido.length}곳이 있습니다. 오늘수영에서 지금 이 시간 자유수영이 가능한 곳과 요일별 시간표, 요금을 확인할 수 있어요.`,
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={faq} />
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 pb-24 pt-12">
        <Header variant="back" title={`${sido} 자유수영장`} backHref="/pools" />

        {/* 답변형 요약(GEO) */}
        <p className="text-sm leading-relaxed text-text-sub">
          {sido}에는 공공 수영장 {inSido.length}곳이 있습니다. 아래에서 오늘
          자유수영 시간과 요금을 확인하세요.
        </p>

        {sigungus.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sigungus.map(({ sigungu, count }) => (
              <Link
                key={sigungu}
                href={`/pools/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-sm text-text shadow-[1px_1px_4px_0px_rgba(0,0,0,0.12)] transition active:scale-[0.99]"
              >
                <span className="font-bold">{sigungu}</span>
                <span className="text-text-sub">{count}</span>
              </Link>
            ))}
          </div>
        )}

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
