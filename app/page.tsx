import { Header } from '@/components/layout/Header';
import { HomeClient } from '@/components/home/HomeClient';
import { ViewToggle } from '@/components/home/ViewToggle';
import { TabBar } from '@/components/layout/TabBar';
import { getPoolsData } from '@/lib/pools-data';

// "지금 상태"를 보여주는 화면이므로 매 요청 시 최신 데이터(API 우선)를 읽는다.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { pools, freeSwimPriceTiers } = await getPoolsData();

  return (
    <>
      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-12">
        <Header variant="location" right={<ViewToggle active="list" />} />
        <div className="mt-4">
          <HomeClient pools={pools} priceTiers={freeSwimPriceTiers} />
        </div>
      </main>
      <TabBar active="home" />
    </>
  );
}
