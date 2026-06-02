'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { pools, getPoolNowStatus, priceTiers, type NowStatus } from '@/lib/pools';
import { nowInSeoul } from '@/lib/time';
import { formatWon, tierLabel } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/cn';

const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

const STATUS_COLOR: Record<NowStatus['kind'], string> = {
  open: '#2DB16B',
  soon: '#F0A231',
  'closed-today': '#9797A0',
  'none-today': '#9797A0',
};

function priceSummary(poolId: string): string {
  const pool = pools.find((p) => p.id === poolId)!;
  const tiers = new Set(pool.freeSwim.sessions.map((s) => s.tier));
  return (['full', 'half'] as const)
    .filter((t) => tiers.has(t))
    .map((t) => `${tierLabel(t, true)} ${formatWon(priceTiers[t].성인)}`)
    .join(' · ');
}

/**
 * 지도뷰 (Figma Map 19:86 바인딩). 검증 좌표로 핀 표시, 상태색, 핀 선택 시 미니카드.
 * Kakao Maps JS SDK 사용 — NEXT_PUBLIC_KAKAO_MAP_KEY 필요. 키 없으면 권역 핀 폴백.
 */
export function MapView() {
  const now = useMemo(() => nowInSeoul(), []);
  const [selected, setSelected] = useState(pools[0]);
  const [failed, setFailed] = useState(false);
  const mapEl = useRef<HTMLDivElement>(null);
  const showMap = !!KEY && !failed;

  useEffect(() => {
    if (!KEY || !mapEl.current) return;
    const id = 'kakao-map-sdk';
    const init = () => {
      const kakao = window.kakao;
      if (!kakao?.maps) {
        setFailed(true); // 401 등으로 SDK 미정의 → 폴백
        return;
      }
      kakao.maps.load(() => {
        const center = new kakao.maps.LatLng(37.5419, 127.1956);
        const map = new kakao.maps.Map(mapEl.current!, { center, level: 7 });
        const bounds = new kakao.maps.LatLngBounds();
        pools.forEach((p) => {
          if (p.lat == null || p.lng == null) return;
          bounds.extend(new kakao.maps.LatLng(p.lat, p.lng));
          const color = STATUS_COLOR[getPoolNowStatus(p, now).kind];
          const pin = document.createElement('div');
          pin.style.cssText = `display:flex;align-items:center;gap:4px;background:#fff;border:2px solid ${color};border-radius:999px;padding:3px 8px;font-size:12px;font-weight:700;color:#2a2d34;box-shadow:0 1px 4px rgba(0,0,0,.2);cursor:pointer`;
          pin.innerHTML = `<span style="width:8px;height:8px;border-radius:999px;background:${color}"></span>${p.region}`;
          pin.addEventListener('click', () => setSelected(p));
          new kakao.maps.CustomOverlay({
            position: new kakao.maps.LatLng(p.lat, p.lng),
            yAnchor: 1,
            content: pin,
          }).setMap(map);
        });
        map.setBounds(bounds); // 4개 핀이 한눈에 들어오도록 영역 맞춤
      });
    };
    if (window.kakao?.maps) return init();
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.async = true;
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`;
    s.onload = init;
    s.onerror = () => setFailed(true); // 도메인 미등록(401) 등 로드 실패
    document.head.appendChild(s);
  }, [now]);

  return (
    <div className="relative">
      {showMap ? (
        <div ref={mapEl} className="h-[60vh] w-full rounded-input bg-line" />
      ) : (
        // 폴백 — 키 없음/도메인 미등록(401) 등으로 지도 미로드 시 권역 핀 버튼
        <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 rounded-input bg-primary-5 p-6">
          <p className="text-center text-sm text-text-sub">
            {failed
              ? '지도를 불러오지 못했어요. Kakao 도메인 등록(현재 주소)을 확인해주세요.'
              : '지도를 보려면 Kakao 지도 키(NEXT_PUBLIC_KAKAO_MAP_KEY)가 필요해요.'}
            <br />
            아래에서 시설을 선택해 정보를 확인하세요.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {pools.map((p) => {
              const color = STATUS_COLOR[getPoolNowStatus(p, now).kind];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border-2 bg-surface px-3 py-1.5 text-xs font-bold text-text',
                    selected.id === p.id ? 'ring-2 ring-primary' : '',
                  )}
                  style={{ borderColor: color }}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {p.region}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 미니카드 */}
      <div className="mt-3 flex flex-col gap-2 rounded-input bg-surface p-4 shadow-[1px_1px_4px_0px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between">
          <span className="text-body font-bold text-text">{selected.name}</span>
          <span className="text-sm text-text-sub">{selected.region}</span>
        </div>
        <StatusBadge status={getPoolNowStatus(selected, now)} />
        <span className="text-sm text-text">{priceSummary(selected.id)}</span>
      </div>
    </div>
  );
}
