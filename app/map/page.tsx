import { Header } from '@/components/layout/Header';
import { ViewToggle } from '@/components/home/ViewToggle';
import { MapView } from '@/components/map/MapView';
import { TabBar } from '@/components/layout/TabBar';
import { getPoolsData } from '@/lib/pools-data';

// 핀 상태색이 "지금 상태"를 반영하므로 최신 데이터(API 우선)를 읽는다.
export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const { pools } = await getPoolsData();

  return (
    <>
      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-12">
        <Header variant="location" right={<ViewToggle active="map" />} />
        <div className="mt-4">
          <MapView pools={pools} />
        </div>
      </main>
      <TabBar active="home" />
    </>
  );
}
