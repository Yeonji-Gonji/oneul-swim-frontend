'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { Pool } from '@/lib/types';
import { getPoolNowStatus, sessionsOnWeekday } from '@/lib/pools';
import { nowInSeoul, type Dayjs } from '@/lib/time';
import { distanceKm, formatDistance } from '@/lib/geo';
import { formatWon, tierLabel } from '@/lib/format';
import {
  MapSheet,
  PEEK_ABOVE_TABBAR,
  type MapSheetHandle,
} from '@/components/map/MapSheet';
import {
  DAY_OPTIONS,
  DayStatus,
  type DayFilter,
} from '@/components/map/DayStatus';
import { PoolFloatingBox } from '@/components/map/PoolFloatingBox';
import { cn } from '@/lib/cn';
import { IconNavigation } from '@/components/ui/icons';

const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

/** 마커 색 kind (상태색 3분류) */
type MarkerKind = 'open' | 'soon' | 'gray';
const STATUS_HEX: Record<MarkerKind, string> = {
  open: '#2DB16B',
  soon: '#F0A231',
  gray: '#9797A0',
};

const STATUS_OPTIONS: {
  v: 'all' | 'open' | 'notopen';
  label: string;
  dot: string | null;
}[] = [
  { v: 'all', label: '전체', dot: null },
  { v: 'open', label: '지금 운영중', dot: STATUS_HEX.open },
  { v: 'notopen', label: '오픈 준비중', dot: STATUS_HEX.soon },
];

const LIST_CAP = 80; // 미가상화 리스트 렌더 상한(전국 600+ 대비)

/** 좌표 폴백 센터(대한민국 중앙 근방) */
const DEFAULT_CENTER = { lat: 36.5, lng: 127.85, level: 13 };

const GEO_OPTS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 60_000,
};

function areaLabel(pool: Pool): string {
  return pool.sigungu ?? pool.region ?? pool.sido ?? '';
}

function priceSummary(pool: Pool): string {
  const sessions = pool.freeSwim?.sessions ?? [];
  const fees = pool.fees;
  if (!fees || sessions.length === 0) return '';
  const tiers = new Set(sessions.map((s) => s.tier));
  return (['full', 'half'] as const)
    .filter((t) => tiers.has(t) && fees[t]?.성인 != null)
    .map((t) => `${tierLabel(t, true)} ${formatWon(fees[t]!.성인!)}`)
    .join(' · ');
}

/** 요일 필터 기준 마커 색 kind */
function markerKind(pool: Pool, day: DayFilter, now: Dayjs): MarkerKind {
  if (day === 'today') {
    const k = getPoolNowStatus(pool, now).kind;
    if (k === 'open') return 'open';
    if (k === 'soon') return 'soon';
    return 'gray';
  }
  if (!pool.freeSwim || pool.freeSwim.sessions.length === 0) return 'gray';
  return sessionsOnWeekday(pool, day).length > 0 ? 'open' : 'gray';
}

/** 마커 kind 정렬 우선순위 */
const kindRank: Record<MarkerKind, number> = { open: 0, soon: 1, gray: 2 };

/** 카카오 핀 SVG(data URI) — 상태색 물방울 핀 */
const pinCache = new Map<string, string>();
function pinSrc(hex: string): string {
  const cached = pinCache.get(hex);
  if (cached) return cached;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34"><path d="M13 1C6.4 1 1 6.3 1 12.9 1 21.4 13 33 13 33s12-11.6 12-20.1C25 6.3 19.6 1 13 1z" fill="${hex}" stroke="#fff" stroke-width="2"/><circle cx="13" cy="12.8" r="4.4" fill="#fff"/></svg>`;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  pinCache.set(hex, src);
  return src;
}

/**
 * 맵-퍼스트 홈 (Apple 지도 최신 UI 레퍼런스).
 * 내 위치 기반 지도 + 플로팅 글라스 지역/날짜 필터 + 드래그 바텀시트 리스트(보조).
 * Kakao Maps SDK 필요(NEXT_PUBLIC_KAKAO_MAP_KEY). 키 없음/실패 시 지도는 폴백 배경,
 * 필터·리스트는 그대로 동작(앱 사용 가능).
 */
export function MapExplorer({ pools }: { pools: Pool[] }) {
  const now = useMemo(() => nowInSeoul(), []);
  const [day, setDay] = useState<DayFilter>('today');
  const [status, setStatus] = useState<'all' | 'open' | 'notopen'>('all');
  const [sido, setSido] = useState('all');
  const [sigungu, setSigungu] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [geo, setGeo] = useState<'idle' | 'locating' | 'granted' | 'denied'>(
    'idle',
  );
  const [mapReady, setMapReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const userOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const scopeKeyRef = useRef<string>('');
  const mapSheetRef = useRef<MapSheetHandle>(null);
  // 플로팅박스: 좌표 결속 CustomOverlay + 포털 컨테이너(FR-1)
  const floatOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const [floatBoxEl, setFloatBoxEl] = useState<HTMLDivElement | null>(null);

  const showMap = !!KEY && !failed;

  // 지역 옵션
  const sidoOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of pools) if (p.sido) set.add(p.sido);
    return [...set].sort();
  }, [pools]);
  const sigunguOptions = useMemo(() => {
    if (sido === 'all') return [];
    const set = new Set<string>();
    for (const p of pools)
      if (p.sido === sido && p.sigungu) set.add(p.sigungu);
    return [...set].sort();
  }, [pools, sido]);

  // 지역 스코프
  const scoped = useMemo(
    () =>
      pools.filter((p) => {
        if (sido !== 'all' && p.sido !== sido) return false;
        if (sigungu !== 'all' && p.sigungu !== sigungu) return false;
        return true;
      }),
    [pools, sido, sigungu],
  );

  // 상태 필터(전체/지금 운영중/오픈 준비중) — 마커·리스트 공통 적용
  const filteredPools = useMemo(() => {
    if (status === 'all') return scoped;
    // open = 지금 운영중 / notopen = 운영중이 아닌 모든 곳(준비중·종료·없음·정보없음)
    return scoped.filter((p) => {
      const isOpen = markerKind(p, day, now) === 'open';
      return status === 'open' ? isOpen : !isOpen;
    });
  }, [scoped, status, day, now]);

  // 거리 + 정렬된 리스트
  const listed = useMemo(() => {
    const withMeta = filteredPools.map((p) => ({
      pool: p,
      dist: userLoc ? distanceKm(userLoc.lat, userLoc.lng, p.lat, p.lng) : null,
      kind: markerKind(p, day, now),
    }));
    withMeta.sort((a, b) => {
      if (userLoc) {
        const da = a.dist ?? Infinity;
        const db = b.dist ?? Infinity;
        if (da !== db) return da - db;
      }
      const rk = kindRank[a.kind] - kindRank[b.kind];
      if (rk !== 0) return rk;
      return a.pool.name.localeCompare(b.pool.name, 'ko');
    });
    return withMeta;
  }, [filteredPools, userLoc, day, now]);

  const visibleList = listed.slice(0, LIST_CAP);
  // 필터 결과 기준 조회(FR-6, SD-4) — 대상이 필터에서 빠지면 null → 박스 미렌더
  const selectedPool = selectedId
    ? filteredPools.find((p) => p.id === selectedId) ?? null
    : null;
  // 필터 변경으로 선택 대상이 결과에서 빠지면 상태도 해제(SD-4) — 렌더 중 보정 패턴
  if (selectedId !== null && selectedPool === null) {
    setSelectedId(null);
  }

  const handleSido = (v: string) => {
    setSido(v);
    setSigungu('all');
  };

  const applyPos = useCallback((pos: GeolocationPosition) => {
    setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    setGeo('granted');
  }, []);

  // 버튼(이벤트 핸들러)에서 호출 — 여기선 'locating' 동기 표시 OK
  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeo('denied');
      return;
    }
    setGeo('locating');
    navigator.geolocation.getCurrentPosition(applyPos, () => setGeo('denied'), GEO_OPTS);
  }, [applyPos]);

  // 최초 위치 요청 — 콜백에서만 setState(effect 내 동기 setState 회피)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(applyPos, () => setGeo('denied'), GEO_OPTS);
  }, [applyPos]);

  // 지도 SDK 로드 & 초기화 (1회)
  useEffect(() => {
    if (!KEY || !mapEl.current) return;
    const id = 'kakao-map-sdk';
    const init = () => {
      const kakao = window.kakao;
      if (!kakao?.maps) {
        setFailed(true);
        return;
      }
      kakao.maps.load(() => {
        if (!mapEl.current || mapRef.current) return;
        const map = new kakao.maps.Map(mapEl.current, {
          center: new kakao.maps.LatLng(
            DEFAULT_CENTER.lat,
            DEFAULT_CENTER.lng,
          ),
          level: DEFAULT_CENTER.level,
        });
        map.setMaxLevel(13); // 줌아웃 상한 = 전국 초기 뷰(FR-7, SD-2)
        // 빈 지도 탭 → 플로팅박스 닫기(FR-3). 마커/clickable 오버레이 탭은 전파되지 않음
        kakao.maps.event.addListener(map, 'click', () => setSelectedId(null));
        mapRef.current = map;
        setMapReady(true);
      });
    };
    if (window.kakao?.maps) {
      init();
      return;
    }
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.async = true;
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false&libraries=clusterer`;
    s.onload = init;
    s.onerror = () => setFailed(true);
    document.head.appendChild(s);
  }, []);

  /**
   * 마커가 가시 영역(필터 스택 하단 ~ peek 시트 상단)의 위에서 60% 지점에 오도록
   * 보정한 중심으로 panTo(FR-2, REQ-NF-002) — 위쪽 40%는 플로팅박스 전개 공간.
   * 레벨 변화 없는 이동이므로 projection으로 픽셀↔좌표 환산.
   */
  const panToReveal = useCallback((pos: kakao.maps.LatLng) => {
    const kakao = window.kakao;
    const map = mapRef.current;
    const el = mapEl.current;
    if (!kakao?.maps || !map || !el) return;
    const viewH = el.clientHeight;
    const visTop =
      document.getElementById('map-filter-stack')?.getBoundingClientRect()
        .bottom ?? 0;
    const tabbarH =
      document.querySelector('nav')?.getBoundingClientRect().height ?? 58;
    const visBottom = viewH - tabbarH - PEEK_ABOVE_TABBAR;
    const targetY = visTop + (visBottom - visTop) * 0.6;
    const proj = map.getProjection();
    const markerPt = proj.containerPointFromCoords(pos);
    // 화면 중심이 (markerPt.x, markerPt.y + h/2 − targetY)에 오면 마커가 targetY에 놓인다
    const center = proj.coordsFromContainerPoint(
      new kakao.maps.Point(markerPt.x, markerPt.y + viewH / 2 - targetY),
    );
    map.panTo(center);
  }, []);

  // 마커 (재)빌드 — 스코프/요일 변경 시
  useEffect(() => {
    const kakao = window.kakao;
    if (!mapReady || !kakao?.maps || !mapRef.current) return;
    const map = mapRef.current;

    // 이전 마커/클러스터 정리
    clustererRef.current?.clear();
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new kakao.maps.LatLngBounds();
    const markers: kakao.maps.Marker[] = [];
    filteredPools.forEach((p) => {
      if (p.lat == null || p.lng == null) return;
      const pos = new kakao.maps.LatLng(p.lat, p.lng);
      bounds.extend(pos);
      const hex = STATUS_HEX[markerKind(p, day, now)];
      const image = new kakao.maps.MarkerImage(
        pinSrc(hex),
        new kakao.maps.Size(26, 34),
        { offset: new kakao.maps.Point(13, 34) },
      );
      const marker = new kakao.maps.Marker({ position: pos, image });
      kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedId(p.id);
        panToReveal(pos);
      });
      markers.push(marker);
    });
    markersRef.current = markers;

    // 클러스터러 사용 가능하면 클러스터, 아니면 직접 표시
    if (kakao.maps.MarkerClusterer) {
      if (!clustererRef.current) {
        clustererRef.current = new kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 6,
          disableClickZoom: false,
        });
      }
      clustererRef.current.addMarkers(markers);
    } else {
      markers.forEach((m) => m.setMap(map));
    }

    // 지역 스코프가 바뀌었고 사용자가 위치센터를 잡지 않았으면 영역 맞춤
    const scopeKey = `${sido}|${sigungu}`;
    if (scopeKey !== scopeKeyRef.current && !bounds.isEmpty()) {
      if (!(userLoc && sido === 'all')) map.setBounds(bounds);
      scopeKeyRef.current = scopeKey;
    }
  }, [mapReady, filteredPools, day, now, sido, sigungu, userLoc, panToReveal]);

  // 플로팅박스 오버레이 관리(FR-1) — selectedPool 파생. 좌표 결속이라 마커 재생성과 무관(E-6)
  useEffect(() => {
    const kakao = window.kakao;
    if (!mapReady || !kakao?.maps || !mapRef.current) return;
    if (!selectedPool || selectedPool.lat == null || selectedPool.lng == null) {
      floatOverlayRef.current?.setMap(null);
      return;
    }
    const pos = new kakao.maps.LatLng(selectedPool.lat, selectedPool.lng);
    let overlay = floatOverlayRef.current;
    if (!overlay) {
      const el = document.createElement('div');
      // 하단 중앙 앵커(yAnchor:1 상당)를 CSS로 처리 — kakao의 anchor 오프셋은
      // 콘텐츠 크기 측정 기반이라 포털 렌더 전(빈 div) 생성 시 0으로 굳는다
      el.style.transform = 'translate(-50%, -100%)';
      overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: el,
        xAnchor: 0,
        yAnchor: 0,
        zIndex: 10, // 내 위치 오버레이(5)보다 위
        clickable: true, // 박스 내부 탭이 map click(빈 영역 닫기)으로 전파되지 않음
      });
      floatOverlayRef.current = overlay;
      setFloatBoxEl(el);
    } else {
      overlay.setPosition(pos);
    }
    overlay.setMap(mapRef.current);
  }, [mapReady, selectedPool]);

  /** 리스트 아이템 탭 → 시트 축소 → 줌 보정 → 중심 보정 → 박스 활성(FR-4) */
  const handleListTap = useCallback(
    (pool: Pool) => {
      mapSheetRef.current?.snapTo('peek');
      const kakao = window.kakao;
      const map = mapRef.current;
      if (kakao?.maps && map && pool.lat != null && pool.lng != null) {
        const pos = new kakao.maps.LatLng(pool.lat, pool.lng);
        // 클러스터러 minLevel(6) 아래로 줌인해 개별 마커 노출 보장(SD-3)
        if (map.getLevel() > 5) map.setLevel(5, { anchor: pos });
        panToReveal(pos);
      }
      setSelectedId(pool.id);
    },
    [panToReveal],
  );

  // 내 위치 오버레이 + 센터링
  useEffect(() => {
    const kakao = window.kakao;
    if (!mapReady || !kakao?.maps || !mapRef.current || !userLoc) return;
    const map = mapRef.current;
    const pos = new kakao.maps.LatLng(userLoc.lat, userLoc.lng);
    if (!userOverlayRef.current) {
      const dot = document.createElement('div');
      dot.style.cssText =
        'width:18px;height:18px;border-radius:999px;background:#2e9bd6;border:3px solid #fff;box-shadow:0 0 0 4px rgba(46,155,214,.25),0 1px 3px rgba(0,0,0,.3)';
      userOverlayRef.current = new kakao.maps.CustomOverlay({
        position: pos,
        content: dot,
        zIndex: 5,
      });
      userOverlayRef.current.setMap(map);
      map.setLevel(5);
      map.setCenter(pos);
    } else {
      userOverlayRef.current.setPosition(pos);
    }
  }, [mapReady, userLoc]);

  const recenter = () => {
    if (userLoc && mapRef.current && window.kakao?.maps) {
      mapRef.current.setLevel(5);
      mapRef.current.panTo(
        new window.kakao.maps.LatLng(userLoc.lat, userLoc.lng),
      );
    } else {
      locate();
    }
  };

  const scopeName =
    sido === 'all' ? '전국' : sigungu === 'all' ? sido : sigungu;
  const openCount = useMemo(
    () => listed.filter((x) => x.kind === 'open').length,
    [listed],
  );

  return (
    <div className="fixed inset-0 mx-auto w-full max-w-md overflow-hidden bg-bg">
      <h1 className="sr-only">오늘수영 지도 — 내 주변 자유수영장</h1>

      {/* 지도 or 폴백 배경 */}
      {showMap ? (
        <div ref={mapEl} className="absolute inset-0" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-primary-5 px-8 text-center">
          <p className="text-sm leading-relaxed text-text-sub">
            {failed
              ? '지도를 불러오지 못했어요. Kakao 지도 도메인 등록을 확인해주세요.'
              : '지도를 보려면 Kakao 지도 키가 필요해요.'}
            <br />
            아래 목록에서 수영장을 확인할 수 있어요.
          </p>
        </div>
      )}

      {/* 플로팅 글라스 필터 (상단) — Apple 지도풍 */}
      <div
        id="map-filter-stack"
        className="absolute inset-x-0 top-0 z-20 flex flex-col gap-2 px-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <div className="flex items-center gap-2">
          <label className="glass-panel flex items-center rounded-full py-2 pr-2 pl-4 shadow-card">
            <span className="pr-1.5 text-sm font-bold text-text">지역</span>
            <select
              value={sido}
              onChange={(e) => handleSido(e.target.value)}
              aria-label="지역(시도) 선택"
              className="bg-transparent text-sm text-text outline-none"
            >
              <option value="all">전국</option>
              {sidoOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          {sido !== 'all' && sigunguOptions.length > 0 && (
            <label className="glass-panel flex items-center rounded-full py-2 pr-2 pl-4 shadow-card">
              <select
                value={sigungu}
                onChange={(e) => setSigungu(e.target.value)}
                aria-label="지역(시군구) 선택"
                className="bg-transparent text-sm text-text outline-none"
              >
                <option value="all">{sido} 전체</option>
                {sigunguOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* 날짜(요일) 필터 — 가로 스크롤 글라스 칩 */}
        <div className="glass-panel flex gap-1 overflow-x-auto rounded-full p-1 shadow-card scrollbar-none">
          {DAY_OPTIONS.map((d) => {
            const active = d.v === day;
            return (
              <button
                key={String(d.v)}
                type="button"
                onClick={() => setDay(d.v)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-sm transition duration-150 active:scale-[0.96]',
                  active
                    ? 'bg-primary-fill font-bold text-white'
                    : 'font-medium text-text-mute',
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {/* 상태 필터 — 전체 / 지금 운영중 / 오픈 준비중 */}
        <div className="glass-panel flex gap-1 self-start rounded-full p-1 shadow-card">
          {STATUS_OPTIONS.map((s) => {
            const active = s.v === status;
            return (
              <button
                key={s.v}
                type="button"
                onClick={() => setStatus(s.v)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition duration-150 active:scale-[0.96]',
                  active
                    ? 'bg-primary-fill font-bold text-white'
                    : 'font-medium text-text-mute',
                )}
              >
                {s.dot && (
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: s.dot }}
                    aria-hidden
                  />
                )}
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 플로팅 컨트롤 (우측) — 내 위치 */}
      <div
        className="absolute right-3 z-20 flex flex-col gap-2"
        style={{ top: 'calc(env(safe-area-inset-top) + 9.75rem)' }}
      >
        <button
          type="button"
          onClick={recenter}
          aria-label="내 위치로 이동"
          className="glass-panel flex size-11 items-center justify-center rounded-full shadow-card active:scale-95"
        >
          <IconNavigation
            className={cn(
              'size-5',
              geo === 'granted' ? 'text-primary' : 'text-text',
              geo === 'locating' && 'animate-spin',
            )}
          />
        </button>
      </div>

      {/* 마커 위 플로팅박스 — CustomOverlay 컨테이너에 포털 렌더(FR-1) */}
      {floatBoxEl &&
        selectedPool &&
        createPortal(
          <PoolFloatingBox
            pool={selectedPool}
            day={day}
            now={now}
            onClose={() => setSelectedId(null)}
          />,
          floatBoxEl,
        )}

      {/* 바텀시트 리스트 (보조) */}
      <MapSheet
        ref={mapSheetRef}
        header={
          <div className="flex items-baseline justify-between">
            <span className="text-body font-bold text-text">
              {scopeName} 수영장 {listed.length}곳
            </span>
            {day === 'today' && openCount > 0 && (
              <span className="text-sm font-bold text-now-open-ink">
                지금 {openCount}곳
              </span>
            )}
          </div>
        }
      >
        {visibleList.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {visibleList.map(({ pool, dist }) => {
              // 지도 모드 + 좌표 보유 → 지도 연동 버튼(REQ-010).
              // 좌표 없음(마커 미생성)·폴백 모드는 기존 상세 직행 Link 유지(E-1, E-9)
              const mapLinkable =
                showMap && pool.lat != null && pool.lng != null;
              const itemClass = cn(
                'flex w-full flex-col gap-2 rounded-input bg-surface p-3.5 text-left transition active:scale-[0.99]',
                selectedId === pool.id
                  ? 'ring-2 ring-primary'
                  : 'ring-1 ring-line',
              );
              const content = (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-body font-bold text-text">
                      {pool.name}
                    </span>
                    <span className="shrink-0 text-sm text-text-sub">
                      {formatDistance(dist) ?? areaLabel(pool)}
                    </span>
                  </div>
                  <DayStatus pool={pool} day={day} now={now} />
                  {priceSummary(pool) && (
                    <span className="text-sm text-text">
                      {priceSummary(pool)}
                    </span>
                  )}
                </>
              );
              return (
                <li key={pool.id}>
                  {mapLinkable ? (
                    <button
                      type="button"
                      onClick={() => handleListTap(pool)}
                      className={itemClass}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link href={`/pool/${pool.id}`} className={itemClass}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
            {listed.length > LIST_CAP && (
              <li className="py-3 text-center text-sm text-text-sub">
                가까운 {LIST_CAP}곳만 표시 중 · 지역을 좁히면 더 정확해요
              </li>
            )}
          </ul>
        ) : (
          <p className="py-10 text-center text-sm text-text-sub">
            이 지역에 등록된 수영장이 없어요.
          </p>
        )}
      </MapSheet>
    </div>
  );
}
