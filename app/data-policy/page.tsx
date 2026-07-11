import type { Metadata } from 'next';
import { pools } from '@/lib/pools';
import { dayjs } from '@/lib/time';
import { Header } from '@/components/layout/Header';
import { TabBar } from '@/components/layout/TabBar';

export const metadata: Metadata = {
  title: '데이터 기준 안내',
};

/** 데이터 출처·검증 원칙 안내 — 수집 방식의 투명성이 이 앱의 신뢰 기반 */
export default function DataPolicyPage() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 pb-24 pt-12">
        <Header variant="back" title="데이터 기준 안내" backHref="/more" />

        <section className="rounded-input bg-surface p-4 shadow-card">
          <h2 className="text-sm font-bold text-text">어디서 가져오나요</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-text-sub">
            시간표·요금·운영 정보는 하남도시공사 공식 홈페이지에 공개된 자료를
            기준으로 합니다. 추측하거나 지어내는 정보는 싣지 않아요. 공식
            자료에 없는 항목(예: 강습 등록일)은 &ldquo;시설 확인&rdquo;으로
            표기합니다.
          </p>
        </section>

        <section className="rounded-input bg-surface p-4 shadow-card">
          <h2 className="text-sm font-bold text-text">어떻게 검증하나요</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-text-sub">
            운영자가 공식 페이지를 주기적으로 점검해 변경 사항을 반영하고,
            이용자 제보가 들어오면 원문과 대조해 확인 후 갱신합니다. 반영
            결과는 &lsquo;내 제보 내역&rsquo;에서 확인할 수 있어요.
          </p>
        </section>

        <section className="rounded-input bg-surface p-4 shadow-card">
          <h2 className="text-sm font-bold text-text">시설별 확인 일자</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {pools.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between text-[13px]"
              >
                <span className="text-text">{p.name}</span>
                <span className="text-text-sub">
                  {dayjs(p.updatedAt).format('YYYY.MM.DD')} 확인
                </span>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs leading-relaxed text-text-sub">
          분기·시즌마다 운영이 바뀔 수 있어요. 중요한 방문이라면 시설에 전화로
          한 번 더 확인하는 것을 권장합니다.
        </p>
      </main>
      <TabBar active="more" />
    </>
  );
}
