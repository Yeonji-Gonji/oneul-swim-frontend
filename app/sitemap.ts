import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/constants/site';
import { getPoolsList } from '@/lib/pools-data';
import { listSidos, listSigungus } from '@/lib/regions';

// 시설/지역이 늘면 반영되도록 ISR(1시간).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pools = await getPoolsList();
  const abs = (path: string) => `${SITE_URL}${path}`;

  // 고정 상위 경로 (admin·정책·리포트 페이지는 색인 제외)
  const staticEntries: MetadataRoute.Sitemap = [
    { url: abs('/'), changeFrequency: 'hourly', priority: 1 },
    { url: abs('/pools'), changeFrequency: 'daily', priority: 0.9 },
    { url: abs('/lessons'), changeFrequency: 'weekly', priority: 0.6 },
    { url: abs('/map'), changeFrequency: 'daily', priority: 0.7 },
  ];

  // 지역 페이지: 시도 + (시도,시군구)
  const sidos = listSidos(pools);
  const sidoEntries: MetadataRoute.Sitemap = sidos.map(({ sido }) => ({
    url: abs(`/pools/${encodeURIComponent(sido)}`),
    changeFrequency: 'daily',
    priority: 0.8,
  }));
  const sigunguEntries: MetadataRoute.Sitemap = sidos.flatMap(({ sido }) =>
    listSigungus(pools, sido).map(({ sigungu }) => ({
      url: abs(
        `/pools/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`,
      ),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  );

  // 시설 상세: lastModified = updatedAt
  const poolEntries: MetadataRoute.Sitemap = pools.map((p) => ({
    url: abs(`/pool/${p.id}`),
    lastModified: p.updatedAt,
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  return [
    ...staticEntries,
    ...sidoEntries,
    ...sigunguEntries,
    ...poolEntries,
  ];
}
