import type { ReactNode } from 'react';
import Link from 'next/link';
import { IconPin, IconChevronLeft } from '@/components/ui/icons';

/**
 * 전 페이지 공용 헤더 — 케이스별 variant.
 * - location: 핀 + 지역명 (홈/지도). right 슬롯에 토글 등.
 * - back: ‹ + 제목 (상세).
 * - title: 큰 제목 (강습알림/더보기).
 * 일관된 높이(h-11)·정렬·우측 슬롯을 보장한다.
 */
type HeaderProps = { right?: ReactNode } & (
  | { variant: 'location'; label?: string }
  | { variant: 'back'; title: string; backHref?: string }
  | { variant: 'title'; title: string }
);

export function Header(props: HeaderProps) {
  return (
    <header className="flex h-11 items-center justify-between gap-2">
      {props.variant === 'location' && (
        <div className="flex items-center gap-1.5">
          <IconPin className="size-4 text-text" />
          <span className="text-lg font-bold text-text">
            {props.label ?? '전국'}
          </span>
        </div>
      )}

      {props.variant === 'back' && (
        <Link
          href={props.backHref ?? '/'}
          className="flex min-w-0 items-center gap-2 text-text"
        >
          <IconChevronLeft className="size-6 shrink-0" />
          <span className="truncate text-lg font-bold">{props.title}</span>
        </Link>
      )}

      {props.variant === 'title' && (
        <h1 className="text-[22px] font-bold text-text">{props.title}</h1>
      )}

      {props.right && <div className="shrink-0">{props.right}</div>}
    </header>
  );
}
