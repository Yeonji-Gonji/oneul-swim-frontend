'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

const THRESHOLD = 70; // 이 이상 당기면 새로고침
const MAX = 96; // 최대 당김 거리
const RESIST = 0.5; // 당김 저항(스크롤보다 덜 따라오게)

/**
 * 당겨서 새로고침 — 홈 리스트 상단에서 아래로 당기면 서버 데이터(force-dynamic)를
 * router.refresh() 로 다시 읽어온다. 고정 요소가 없는 홈 콘텐츠만 감싸므로 transform 안전.
 * PWA standalone 에서는 브라우저 기본 PTR 이 없어 이 커스텀 동작이 자연스럽다.
 */
export function PullToRefresh({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      const eligible = window.scrollY <= 0 && !refreshingRef.current;
      startY.current = eligible ? e.touches[0].clientY : null;
      if (eligible) setDragging(true);
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        if (pullRef.current !== 0) setPull((pullRef.current = 0));
        return;
      }
      const d = Math.min(dy * RESIST, MAX);
      pullRef.current = d;
      setPull(d);
      if (d > 4 && e.cancelable) e.preventDefault(); // 네이티브 오버스크롤 억제
    };
    const onEnd = () => {
      if (startY.current == null) return;
      startY.current = null;
      setDragging(false);
      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPull((pullRef.current = THRESHOLD));
        router.refresh();
        // router.refresh() 는 완료 신호가 없어 짧게 표시 후 정리
        window.setTimeout(() => {
          refreshingRef.current = false;
          setRefreshing(false);
          setPull((pullRef.current = 0));
        }, 900);
      } else {
        setPull((pullRef.current = 0));
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [router]);

  const active = pull > 0 || refreshing;
  const ready = pull >= THRESHOLD;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-11 flex justify-center"
        style={{
          transform: `translateY(${active ? pull : 0}px)`,
          opacity: active ? Math.min(pull / THRESHOLD, 1) : 0,
          transition: dragging ? 'none' : 'transform 0.25s, opacity 0.2s',
        }}
      >
        <div
          className={cn(
            'size-7 rounded-full border-2 border-line',
            ready || refreshing ? 'border-t-primary' : 'border-t-text-sub',
            refreshing && 'animate-spin',
          )}
          style={
            refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }
          }
        />
      </div>
      <div
        style={{
          transform: `translateY(${active ? pull : 0}px)`,
          transition: dragging ? 'none' : 'transform 0.25s',
        }}
      >
        {children}
      </div>
    </div>
  );
}
