'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { DayCode, Pool } from '@/lib/types';
import { getPoolNowStatus, sessionsOnWeekday } from '@/lib/pools';
import { nowInSeoul, type Dayjs } from '@/lib/time';
import { distanceKm, formatDistance } from '@/lib/geo';
import { formatWon, tierLabel } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MapSheet } from '@/components/map/MapSheet';
import { cn } from '@/lib/cn';
import { IconNavigation, IconChevronRight } from '@/components/ui/icons';

const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

/** 마커 색 kind (상태색 3분류) */
type MarkerKind = 'open' | 'soon' | 'gray';
const STATUS_HEX: Record<MarkerKind, string> = {
  open: '#2DB16B',
  soon: '#F0A231',
  gray: '#9797A0',
};

type DayFilter = 'today' | DayCode;
const DAY_OPTIONS: { v: DayFilter; label: string }[] = [
  { v: 'today', label: '오늘' },
  { v: 1, label: '월' },
  { v: 2, label: '화' },
  { v: 3, label: '수' },
  { v: 4, label: '목' },
  { v: 5, label: '금' },
  { v: 6, label: '토' },
  { v: 0, label: '일' },
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

/** 리스트/미니카드 상태 표시 — 오늘은 실시간 뱃지, 다른 요일은 그날 운영 요약 */
function DayStatus({
  pool,
  day,
  now,
}: {
  pool: Pool;
  day: DayFilter;
  now: Dayjs;
}) {
  if (day === 'today') {
    return <StatusBadge status={getPoolNowStatus(pool, now)} />;
  }
  const listing = !pool.freeSwim || pool.freeSwim.sessions.length === 0;
  const ss = listing ? [] : sessionsOnWeekday(pool, day);
  const label = DAY_OPTIONS.find((d) => d.v === day)?.label ?? '';
  let text: string;
  let tone: 'open' | 'gray';
  if (listing) {
    text = '자유수영 정보 준비중';
    tone = 'gray';
  } else if (ss.length > 0) {
    const times = ss
      .slice(0, 2)
      .map((s) => `${s.start}~${s.end}`)
      .join(', ');
    text = `${label} ${times}`;
    tone = 'open';
  } else {
    text = `${label}요일 자유수영 없음`;
    tone = 'gray';
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
        tone === 'open'
          ? 'bg-now-open-soft text-now-open-ink'
          : 'bg-closed-soft text-closed-ink',
      )}
    >
      <span
        className={cn(
          'size-2 rounded-full',
          tone === 'open' ? 'bg-now-open' : 'bg-closed',
        )}
        aria-hidden
      />
      {text}
    </span>
  );
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

  // 거리 + 정렬된 리스트
  const listed = useMemo(() => {
    const withMeta = scoped.map((p) => ({
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
  }, [scoped, userLoc, day, now]);

  const visibleList = listed.slice(0, LIST_CAP);
  const selectedPool = selectedId
    ? scoped.find((p) => p.id === selectedId) ?? null
    : null;

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
        mapRef.current = new kakao.maps.Map(mapEl.current, {
          center: new kakao.maps.LatLng(
            DEFAULT_CENTER.lat,
            DEFAULT_CENTER.lng,
          ),
          level: DEFAULT_CENTER.level,
        });
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
    scoped.forEach((p) => {
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
        map.panTo(pos);
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
  }, [mapReady, scoped, day, now, sido, sigungu, userLoc]);

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
      </div>

      {/* 플로팅 컨트롤 (우측) — 내 위치 */}
      <div
        className="absolute right-3 z-20 flex flex-col gap-2"
        style={{ top: 'calc(env(safe-area-inset-top) + 6.5rem)' }}
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

      {/* 선택 미니카드 (마커 클릭) */}
      {selectedPool && (
        <div
          className="animate-fade-in absolute inset-x-3 z-40"
          style={{ bottom: 'calc(var(--tabbar-h) + 12px)' }}
        >
          <div className="glass-panel relative flex flex-col gap-2 rounded-input p-4 shadow-card">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="닫기"
              className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-fill-secondary text-text-sub"
            >
              ✕
            </button>
            <Link href={`/pool/${selectedPool.id}`} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 pr-6">
                <span className="text-body font-bold text-text">
                  {selectedPool.name}
                </span>
                <span className="shrink-0 text-sm text-text-sub">
                  {userLoc
                    ? (formatDistance(
                        distanceKm(
                          userLoc.lat,
                          userLoc.lng,
                          selectedPool.lat,
                          selectedPool.lng,
                        ),
                      ) ?? areaLabel(selectedPool))
                    : areaLabel(selectedPool)}
                </span>
              </div>
              <DayStatus pool={selectedPool} day={day} now={now} />
              {priceSummary(selectedPool) && (
                <span className="text-sm text-text">
                  {priceSummary(selectedPool)}
                </span>
              )}
              <span className="flex items-center gap-0.5 text-sm font-bold text-primary">
                상세 보기 <IconChevronRight className="size-4" />
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* 바텀시트 리스트 (보조) */}
      <MapSheet
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
            {visibleList.map(({ pool, dist }) => (
              <li key={pool.id}>
                <Link
                  href={`/pool/${pool.id}`}
                  onClick={() => setSelectedId(pool.id)}
                  className={cn(
                    'flex flex-col gap-2 rounded-input bg-surface p-3.5 transition active:scale-[0.99]',
                    selectedId === pool.id
                      ? 'ring-2 ring-primary'
                      : 'ring-1 ring-line',
                  )}
                >
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
                </Link>
              </li>
            ))}
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
