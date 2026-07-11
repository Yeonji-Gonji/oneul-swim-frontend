/**
 * 오늘수영 — 지역(시도/시군구) 집계 유틸.
 *
 * 전국 지역 페이지(SEO/GEO)가 Pool[] 에서 시도·시군구 목록과
 * 소속 시설을 뽑아 쓰는 순수 함수 모음. 시간/상태 계산은 lib/pools.ts.
 * sido·sigungu 가 null 인 시설은 집계에서 제외한다(존재 자체는 목록에 남음).
 */
import type { Pool } from './types';

/** count 내림차순 → 이름 가나다(ko) 오름차순 */
function byCountThenName<T extends { count: number }>(
  key: (v: T) => string,
): (a: T, b: T) => number {
  return (a, b) => b.count - a.count || key(a).localeCompare(key(b), 'ko');
}

/** 시도별 시설 그룹(Map). sido 가 없는 시설은 제외. */
export function groupBySido(pools: Pool[]): Map<string, Pool[]> {
  const map = new Map<string, Pool[]>();
  for (const p of pools) {
    if (!p.sido) continue;
    const list = map.get(p.sido) ?? [];
    list.push(p);
    map.set(p.sido, list);
  }
  return map;
}

/** 시도 목록 + 소속 시설 수. count desc → 가나다. */
export function listSidos(pools: Pool[]): { sido: string; count: number }[] {
  return [...groupBySido(pools).entries()]
    .map(([sido, list]) => ({ sido, count: list.length }))
    .sort(byCountThenName((v) => v.sido));
}

/** 특정 시도의 시군구 목록 + 시설 수. sigungu 없는 시설은 제외. */
export function listSigungus(
  pools: Pool[],
  sido: string,
): { sigungu: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of poolsInSido(pools, sido)) {
    if (!p.sigungu) continue;
    counts.set(p.sigungu, (counts.get(p.sigungu) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([sigungu, count]) => ({ sigungu, count }))
    .sort(byCountThenName((v) => v.sigungu));
}

/** 해당 시도의 시설 목록(원본 순서 유지). */
export function poolsInSido(pools: Pool[], sido: string): Pool[] {
  return pools.filter((p) => p.sido === sido);
}

/** 해당 시군구의 시설 목록(원본 순서 유지). */
export function poolsInSigungu(
  pools: Pool[],
  sido: string,
  sigungu: string,
): Pool[] {
  return pools.filter((p) => p.sido === sido && p.sigungu === sigungu);
}
