/**
 * 오늘수영 — 데이터 로드 & 파생 전처리
 *
 * pools.json(정규화 데이터)을 읽어 화면이 바로 쓰는 형태로 가공한다.
 * - 세션 tier → 실제 대상별 요금 머지
 * - 현재 시각 기준 "지금 상태"(🟢 자유수영 중 / 🟡 곧 시작 / ⚪ 오늘 종료) 계산
 * 모든 시간 계산은 Asia/Seoul 기준(dayjs Dayjs 주입).
 */
import rawData from '../data/pools.json';
import { dayjs, type Dayjs } from './time';
import type {
  FreeSwimSession,
  Pool,
  PoolsData,
  PriceByTarget,
  PriceTiers,
} from './types';

const data = rawData as unknown as PoolsData;

export const pools: Pool[] = data.pools;

export const getPoolById = (id: string): Pool | undefined =>
  pools.find((p) => p.id === id);

/**
 * 리스팅 전용(자유수영 정보 없음) 시설인가 — 데이터 기반 판정.
 * freeSwim.sessions 가 채워지면(어드민/제보) 자동으로 "정상 운영"으로 승격된다.
 * (dataStatus 플래그는 임포트 힌트일 뿐, 화면은 실제 데이터로만 판정)
 */
export const isListing = (pool: Pool): boolean =>
  !pool.freeSwim || pool.freeSwim.sessions.length === 0;

/** 세션의 tier를 시설별 요금표로 변환. 요금 데이터 없으면 undefined */
export const resolveSessionPrice = (
  fees: PriceTiers | null | undefined,
  session: FreeSwimSession,
): Partial<PriceByTarget> | undefined => fees?.[session.tier];

/** "HH:mm" → 분 단위 정수 */
const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** 그 달의 몇 번째 해당 요일인지 (1~5) */
const weekOfMonth = (now: Dayjs): number => Math.ceil(now.date() / 7);

/** 주어진 시점에 이 세션이 '오늘' 운영되는가 (요일 + 주차 조건) */
export const isSessionToday = (
  session: FreeSwimSession,
  now: Dayjs,
): boolean => {
  if (
    !session.dayCodes.includes(now.day() as FreeSwimSession['dayCodes'][number])
  ) {
    return false;
  }
  if (session.weeksOfMonth && !session.weeksOfMonth.includes(weekOfMonth(now))) {
    return false;
  }
  return true;
};

export type NowStatus =
  | { kind: 'open'; session: FreeSwimSession; endsAt: string } // 🟢 진행 중
  | {
      kind: 'soon';
      session: FreeSwimSession;
      startsAt: string;
      minsUntil: number;
    } // 🟡 곧 시작
  | { kind: 'closed-today' } // ⚪ 오늘 세션 종료
  | { kind: 'none-today' } // ⚪ 오늘 자유수영 운영 없음
  | { kind: 'listing' }; // ⚪ 자유수영 정보 준비중(기본정보만)

/** 몇 분 이내에 시작하는 세션을 "곧 시작" 으로 표시할 임계값 */
const SOON_THRESHOLD_MIN = 90;

/** 현재 시각(Asia/Seoul dayjs) 기준 시설의 자유수영 상태. */
export const getPoolNowStatus = (pool: Pool, now: Dayjs): NowStatus => {
  // 자유수영 세션이 없으면(리스팅 전용) 정보 준비중
  if (!pool.freeSwim || pool.freeSwim.sessions.length === 0) {
    return { kind: 'listing' };
  }
  const todays = pool.freeSwim.sessions
    .filter((s) => isSessionToday(s, now))
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  if (todays.length === 0) return { kind: 'none-today' };

  const cur = now.hour() * 60 + now.minute();

  const ongoing = todays.find(
    (s) => toMinutes(s.start) <= cur && cur < toMinutes(s.end),
  );
  if (ongoing) return { kind: 'open', session: ongoing, endsAt: ongoing.end };

  // 아직 시작 안 한 세션 중 가장 빠른 것 — SOON_THRESHOLD_MIN 이내면 "곧 시작"
  const upcoming = todays.find((s) => toMinutes(s.start) > cur);
  if (upcoming) {
    const minsUntil = toMinutes(upcoming.start) - cur;
    if (minsUntil <= SOON_THRESHOLD_MIN) {
      return {
        kind: 'soon',
        session: upcoming,
        startsAt: upcoming.start,
        minsUntil,
      };
    }
    // 90분 초과 — 오늘 세션은 있지만 아직 멀었음(none-today 아님: none-today는 운영일 자체 없음)
    return { kind: 'none-today' };
  }

  return { kind: 'closed-today' };
};

/**
 * "지금 갈 곳" 우선 정렬 키.
 * open(진행 중) → soon(임박 순) → closed-today → none-today.
 */
const statusSortKey = (s: NowStatus): [number, number] => {
  switch (s.kind) {
    case 'open':
      return [0, 0];
    case 'soon':
      return [1, s.minsUntil]; // 곧 시작할수록 위로
    case 'closed-today':
      return [2, 0];
    case 'none-today':
      return [3, 0];
    case 'listing':
      return [4, 0]; // 정보 준비중은 맨 뒤
  }
};

/** 시설을 "지금 상태" 기준으로 정렬(원본 불변). 위치 정렬 도입 전 기본 정렬. */
export const sortPoolsByStatus = (list: Pool[], now: Dayjs): Pool[] =>
  [...list].sort((a, b) => {
    const [ra, ma] = statusSortKey(getPoolNowStatus(a, now));
    const [rb, mb] = statusSortKey(getPoolNowStatus(b, now));
    return ra - rb || ma - mb;
  });

/** "N일 전 업데이트" 신선도 레이블 (now: Asia/Seoul dayjs 주입) */
export const freshnessLabel = (updatedAt: string, now: Dayjs): string => {
  const diffDays = now
    .startOf('day')
    .diff(dayjs(updatedAt).startOf('day'), 'day');
  if (diffDays <= 0) return '오늘 업데이트';
  if (diffDays === 1) return '어제 업데이트';
  return `${diffDays}일 전 업데이트`;
};


