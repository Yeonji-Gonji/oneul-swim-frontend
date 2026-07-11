/**
 * lib/regions.ts 지역 집계 순수 로직 단위 테스트.
 * sido/sigungu null 제외 · count desc → 가나다 정렬을 검증한다.
 */
import { describe, expect, it } from 'vitest';
import {
  listSidos,
  listSigungus,
  poolsInSido,
  poolsInSigungu,
} from './regions';
import type { Pool } from './types';

/** 최소 Pool 픽스처 — 지역 필드만 관심 */
const pool = (id: string, sido: string | null, sigungu: string | null): Pool =>
  ({
    id,
    name: id,
    sido,
    sigungu,
    operator: 'test',
    phone: '',
    address: null,
    lat: null,
    lng: null,
    websiteUrl: '',
    sourceUrl: '',
    updatedAt: '2026-06-01',
    freeSwim: null,
    lessons: [],
  }) as Pool;

const pools: Pool[] = [
  pool('a', '경기도', '하남시'),
  pool('b', '경기도', '하남시'),
  pool('c', '경기도', '성남시'),
  pool('d', '서울특별시', '강남구'),
  pool('e', null, null), // 지역 미상 → 집계 제외
];

describe('listSidos', () => {
  it('sido null 제외 + count desc 정렬', () => {
    expect(listSidos(pools)).toEqual([
      { sido: '경기도', count: 3 },
      { sido: '서울특별시', count: 1 },
    ]);
  });
});

describe('listSigungus', () => {
  it('해당 시도의 시군구별 count(하남 2, 성남 1)', () => {
    expect(listSigungus(pools, '경기도')).toEqual([
      { sigungu: '하남시', count: 2 },
      { sigungu: '성남시', count: 1 },
    ]);
  });

  it('없는 시도면 빈 배열', () => {
    expect(listSigungus(pools, '제주특별자치도')).toEqual([]);
  });
});

describe('poolsInSido / poolsInSigungu', () => {
  it('poolsInSido 는 해당 시도 시설만', () => {
    expect(poolsInSido(pools, '경기도').map((p) => p.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('poolsInSigungu 는 시도+시군구 모두 일치', () => {
    expect(poolsInSigungu(pools, '경기도', '하남시').map((p) => p.id)).toEqual([
      'a',
      'b',
    ]);
  });
});
