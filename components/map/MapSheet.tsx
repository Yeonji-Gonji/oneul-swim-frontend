'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';

type Detent = 'peek' | 'half' | 'full';

const PEEK_ABOVE_TABBAR = 172; // peek 시 탭바 위로 보일 높이(그래버+헤더+카드 1개)
const TOP_RESERVE_FALLBACK = 176; // 상단 필터 스택 실측 전 기본 여백

/**
 * 지도 위 드래그 바텀시트 (iOS/Apple 지도식 3단 detent: peek/half/full).
 * 시트 바닥은 뷰포트 바닥(0)에 고정 — 탭바는 그 위를 덮으므로(스태킹), 스크롤 콘텐츠에
 * 탭바 높이만큼 하단 패딩을 줘서 목록이 탭바 뒤로 가려지지 않게 한다.
 * 위치는 detent(스냅) + dragY(드래그 중 임시 오프셋)에서 파생 — effect-내 setState 없음.
 */
export function MapSheet({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetH, setSheetH] = useState(0);
  const [tabbarH, setTabbarH] = useState(58);
  const [topReserve, setTopReserve] = useState(TOP_RESERVE_FALLBACK);
  const [detent, setDetent] = useState<Detent>('peek');
  const [dragY, setDragY] = useState<number | null>(null);
  const dragStart = useRef<{ pointer: number; base: number } | null>(null);

  const detentY = useCallback(
    (d: Detent): number => {
      if (!sheetH) return 0;
      if (d === 'full') return 0;
      if (d === 'half') return Math.round(sheetH * 0.5);
      // peek: 탭바 위로 PEEK_ABOVE_TABBAR 만큼만 보이도록 내림
      return Math.max(sheetH - tabbarH - PEEK_ABOVE_TABBAR, 0);
    },
    [sheetH, tabbarH],
  );

  useEffect(() => {
    const measure = () => {
      setSheetH(sheetRef.current?.offsetHeight ?? 0);
      const nav = document.querySelector('nav');
      if (nav) setTabbarH(nav.getBoundingClientRect().height);
      // 상단 필터 스택 실측 → 그 아래에서 full detent 시작(노치 safe-area·폰트차 대응)
      const filters = document.getElementById('map-filter-stack');
      if (filters) {
        setTopReserve(Math.round(filters.getBoundingClientRect().bottom) + 12);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    // 필터 스택 높이 변화(시군구 pill 등장 등)도 반영
    const filters = document.getElementById('map-filter-stack');
    const ro =
      typeof ResizeObserver !== 'undefined' && filters
        ? new ResizeObserver(measure)
        : null;
    if (ro && filters) ro.observe(filters);
    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, []);

  const measured = sheetH > 0;
  const y = dragY ?? detentY(detent);
  const maxY = detentY('peek');

  const onPointerDown = (e: PointerEvent) => {
    const base = detentY(detent);
    dragStart.current = { pointer: e.clientY, base };
    setDragY(base);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragStart.current) return;
    const dy = e.clientY - dragStart.current.pointer;
    setDragY(Math.min(Math.max(dragStart.current.base + dy, 0), maxY));
  };
  const onPointerUp = () => {
    if (!dragStart.current) return;
    const cur = dragY ?? dragStart.current.base;
    dragStart.current = null;
    let best: Detent = 'peek';
    let bestDist = Infinity;
    for (const d of ['full', 'half', 'peek'] as Detent[]) {
      const dist = Math.abs(detentY(d) - cur);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    setDetent(best);
    setDragY(null);
  };

  return (
    <div
      ref={sheetRef}
      className="absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-sheet bg-surface shadow-sheet"
      style={{
        height: `calc(100% - ${topReserve}px)`,
        transform: measured ? `translateY(${y}px)` : 'translateY(100%)',
        transition:
          dragY != null
            ? 'none'
            : 'transform 0.34s cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      <div
        className="shrink-0 cursor-grab touch-none pt-2.5 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-line" />
        <div className="px-5 pt-2 pb-1">{header}</div>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5"
        style={{ paddingBottom: `calc(${tabbarH}px + 1rem)` }}
      >
        {children}
      </div>
    </div>
  );
}
