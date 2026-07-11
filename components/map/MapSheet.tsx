'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';

type Detent = 'peek' | 'half' | 'full';

const PEEK_VISIBLE = 148; // 그래버+헤더+카드 1개 정도

/**
 * 지도 위 드래그 바텀시트 (iOS/Apple 지도식 3단 detent: peek/half/full).
 * 그래버·헤더 영역에서만 드래그(리스트 스크롤과 충돌 방지). 탭바 위에 앉는다.
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
  const [detent, setDetent] = useState<Detent>('peek');
  const [dragY, setDragY] = useState<number | null>(null);
  const dragStart = useRef<{ pointer: number; base: number } | null>(null);

  const detentY = useCallback(
    (d: Detent): number => {
      if (!sheetH) return 0;
      if (d === 'full') return 0;
      if (d === 'half') return Math.round(sheetH * 0.46);
      return Math.max(sheetH - PEEK_VISIBLE, 0);
    },
    [sheetH],
  );

  useEffect(() => {
    const measure = () => setSheetH(sheetRef.current?.offsetHeight ?? 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const measured = sheetH > 0;
  const y = dragY ?? detentY(detent);

  const onPointerDown = (e: PointerEvent) => {
    const base = detentY(detent);
    dragStart.current = { pointer: e.clientY, base };
    setDragY(base);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragStart.current) return;
    const dy = e.clientY - dragStart.current.pointer;
    setDragY(
      Math.min(Math.max(dragStart.current.base + dy, 0), detentY('peek')),
    );
  };
  const onPointerUp = () => {
    if (!dragStart.current) return;
    const cur = dragY ?? dragStart.current.base;
    dragStart.current = null;
    // 가장 가까운 detent 로 스냅
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
      className="absolute inset-x-0 z-30 flex flex-col rounded-t-sheet bg-surface shadow-sheet"
      style={{
        bottom: 'var(--tabbar-h)',
        height:
          'calc(100% - var(--tabbar-h) - env(safe-area-inset-top) - 108px)',
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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
        {children}
      </div>
    </div>
  );
}
