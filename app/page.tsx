import { MapExplorer } from '@/components/map/MapExplorer';
import { TabBar } from '@/components/layout/TabBar';
import { JsonLd } from '@/components/seo/JsonLd';
import { getPoolsData } from '@/lib/pools-data';
import { SITE_NAME, SITE_URL } from '@/constants/site';

// "지금 상태" + 위치 기반 지도이므로 매 요청 시 최신 데이터(API 우선)를 읽는다.
export const dynamic = 'force-dynamic';

// 홈 WebSite JSON-LD — 사이트 아이덴티티만 간결하게.
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
};

export default async function HomePage() {
  const { pools } = await getPoolsData();

  return (
    <>
      <JsonLd data={websiteSchema} />
      <MapExplorer pools={pools} />
      <TabBar active="home" />
    </>
  );
}
