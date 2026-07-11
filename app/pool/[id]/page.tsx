import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getPoolNowStatus } from '@/lib/pools';
import { getPoolsData } from '@/lib/pools-data';
import { nowInSeoul } from '@/lib/time';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { buttonClass } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { DaySchedule } from '@/components/pool/DaySchedule';
import { FeeCard } from '@/components/pool/FeeCard';
import { ReportSheet } from '@/components/report/ReportSheet';
import {
  IconWarning,
  IconPhone,
  IconNavigation,
  IconBell,
} from '@/components/ui/icons';

export const dynamic = 'force-dynamic';

export default async function PoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { pools } = await getPoolsData();
  const pool = pools.find((p) => p.id === id);
  if (!pool) redirect('/');

  const now = nowInSeoul();
  const status = getPoolNowStatus(pool, now);
  const listing = !pool.freeSwim || pool.dataStatus === 'listing';
  const kakaoTo =
    pool.lat != null && pool.lng != null
      ? `https://map.kakao.com/link/to/${encodeURIComponent(pool.name)},${pool.lat},${pool.lng}`
      : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 pb-10 pt-12">
      <Header variant="back" title={pool.name} backHref="/" />

      <StatusBadge status={status} />

      {pool.notice && (
        <div className="flex w-full items-start gap-1.5 rounded-input bg-upcoming-soft p-4">
          <IconWarning className="mt-px size-4 shrink-0 text-upcoming-ink" />
          <p className="text-[13px] leading-relaxed text-upcoming-ink">
            {pool.notice}
          </p>
        </div>
      )}

      {listing ? (
        <div className="flex w-full flex-col gap-1.5 rounded-input bg-surface p-4 shadow-[1px_1px_4px_0px_rgba(0,0,0,0.12)]">
          <p className="text-body font-bold text-text">
            자유수영 정보 준비중
          </p>
          <p className="text-sm leading-relaxed text-text-sub">
            이 수영장은 기본 정보만 등록돼 있어요. 자유수영 시간표·요금을
            아시면 아래 제보로 알려주시면 반영할게요.
          </p>
        </div>
      ) : (
        <>
          <DaySchedule pool={pool} />
          <FeeCard pool={pool} />
        </>
      )}

      <div className="flex w-full gap-2.5">
        <a href={`tel:${pool.phone}`} className={cn(buttonClass('medium'), 'flex-1')}>
          <IconPhone className="size-4.5" />
          전화
        </a>
        {kakaoTo && (
          <a
            href={kakaoTo}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonClass('medium'), 'flex-1')}
          >
            <IconNavigation className="size-4.5" />
            길찾기
          </a>
        )}
      </div>

      <Link href="/lessons" className={buttonClass('solid')}>
        <IconBell className="size-4.5" />
        강습 접수 소식 알림 받기
      </Link>

      <ReportSheet poolId={pool.id} poolName={pool.name} />
    </main>
  );
}
