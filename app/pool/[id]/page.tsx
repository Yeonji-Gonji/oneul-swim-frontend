import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getPoolNowStatus, type NowStatus } from '@/lib/pools';
import { getPoolByIdAsync, getPoolsData } from '@/lib/pools-data';
import { nowInSeoul } from '@/lib/time';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { JsonLd } from '@/components/seo/JsonLd';
import { buttonClass } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { DaySchedule } from '@/components/pool/DaySchedule';
import { FeeCard } from '@/components/pool/FeeCard';
import { ReportSheet } from '@/components/report/ReportSheet';
import { SITE_URL } from '@/constants/site';
import type { DayCode, Pool } from '@/lib/types';
import {
  IconWarning,
  IconPhone,
  IconNavigation,
  IconBell,
} from '@/components/ui/icons';

export const dynamic = 'force-dynamic';

/** DayCode(0=일…6=토) → schema.org DayOfWeek */
const SCHEMA_DAY: Record<DayCode, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

/** 상태 → 답변형 한 문장(메타 설명·GEO용) */
function statusSentence(status: NowStatus): string {
  switch (status.kind) {
    case 'open':
      return `지금 자유수영 운영 중이에요(${status.endsAt} 종료).`;
    case 'soon':
      return `${status.startsAt}부터 자유수영이 시작돼요.`;
    case 'closed-today':
      return '오늘 자유수영은 종료됐어요.';
    case 'none-today':
      return '오늘은 자유수영 운영이 없어요.';
    case 'listing':
      return '자유수영 시간표는 준비 중이에요.';
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pool = await getPoolByIdAsync(id);
  if (!pool) {
    return { title: '수영장 정보', alternates: { canonical: `/pool/${id}` } };
  }

  const area = pool.sigungu ?? pool.sido ?? undefined;
  const title = area ? `${pool.name} (${area})` : pool.name;
  const status = getPoolNowStatus(pool, nowInSeoul());
  const region = [pool.sido, pool.sigungu].filter(Boolean).join(' ');
  const description =
    `${region ? `${region} ` : ''}${pool.name}의 자유수영 시간표와 요금. ` +
    statusSentence(status);
  const canonical = `/pool/${pool.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE_URL}${canonical}`,
    },
  };
}

/** 자유수영 세션 → schema.org OpeningHoursSpecification 배열(full 전용) */
function openingHours(pool: Pool) {
  const sessions = pool.freeSwim?.sessions ?? [];
  if (sessions.length === 0) return undefined;
  return sessions.map((s) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: s.dayCodes.map((d) => SCHEMA_DAY[d]),
    opens: s.start,
    closes: s.end,
  }));
}

/** SportsActivityLocation JSON-LD 구성(null 필드는 JsonLd 가 정리) */
function placeSchema(pool: Pool) {
  const canonical = `${SITE_URL}/pool/${pool.id}`;
  const listing = !pool.freeSwim || pool.freeSwim.sessions.length === 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: pool.name,
    url: canonical,
    telephone: pool.phone || undefined,
    sameAs: pool.websiteUrl || undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KR',
      addressRegion: pool.sido ?? undefined,
      addressLocality: pool.sigungu ?? undefined,
      streetAddress: pool.address ?? undefined,
    },
    geo:
      pool.lat != null && pool.lng != null
        ? {
            '@type': 'GeoCoordinates',
            latitude: pool.lat,
            longitude: pool.lng,
          }
        : undefined,
    // listing(기본정보만)은 자유수영 시간 미확정 → openingHours 생략
    openingHoursSpecification: listing ? undefined : openingHours(pool),
  };
}

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
  const listing = !pool.freeSwim || pool.freeSwim.sessions.length === 0;
  const kakaoTo =
    pool.lat != null && pool.lng != null
      ? `https://map.kakao.com/link/to/${encodeURIComponent(pool.name)},${pool.lat},${pool.lng}`
      : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 pb-10 pt-12">
      <JsonLd data={placeSchema(pool)} />
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
