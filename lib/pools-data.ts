/**
 * 오늘수영 — 런타임 데이터 소스 (API 우선 + 정적 폴백).
 *
 * 관리자가 미니 어드민에서 고친 데이터가 재배포 없이 반영되도록,
 * NEXT_PUBLIC_API_URL이 있으면 GET /pools를 먼저 읽는다.
 * 미설정·네트워크 실패·shape 불일치 시에는 항상 정적 data/pools.json으로 폴백한다.
 * (폴백 원칙: API가 죽어도 앱은 정적 데이터로 그대로 동작해야 한다.)
 *
 * 순수 함수(getPoolNowStatus 등)는 lib/pools.ts에 그대로 두고, 여기서는 "데이터 소스"만 담당한다.
 */
import rawData from '../data/pools.json';
import type { FreeSwimTier, Pool, PoolsData, PriceByTarget } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** 정적 폴백 (빌드타임 번들). API 미설정/실패 시 항상 이 값을 반환한다. */
const FALLBACK = rawData as unknown as PoolsData;

/** GET /pools 응답이 data/pools.json과 동일한 shape인지 최소 검증 */
function isValidPoolsData(data: unknown): data is PoolsData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Partial<PoolsData>;
  return Array.isArray(d.pools) && Boolean(d.freeSwimPriceTiers);
}

/**
 * 화면이 쓸 시설 데이터 묶음을 반환한다.
 * API_URL이 있으면 5분 캐시(next.revalidate=300)로 GET /pools를 시도하고,
 * 어떤 실패든 조용히 정적 폴백으로 떨어진다.
 */
export async function getPoolsData(): Promise<PoolsData> {
  if (!API_URL) return FALLBACK;
  try {
    const res = await fetch(`${API_URL}/pools`, { next: { revalidate: 300 } });
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as unknown;
    return isValidPoolsData(data) ? data : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

/** 시설 목록 (API 우선 → 폴백) */
export async function getPoolsList(): Promise<Pool[]> {
  return (await getPoolsData()).pools;
}

/** 자유수영 공통 요금표 (API 우선 → 폴백) */
export async function getPriceTiers(): Promise<
  Record<FreeSwimTier, PriceByTarget>
> {
  return (await getPoolsData()).freeSwimPriceTiers;
}

/** id로 시설 1건 조회 (API 우선 → 폴백). 없으면 undefined */
export async function getPoolByIdAsync(id: string): Promise<Pool | undefined> {
  return (await getPoolsList()).find((p) => p.id === id);
}
