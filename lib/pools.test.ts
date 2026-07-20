/**
 * lib/pools.ts 순수 로직 단위 테스트.
 *
 * 시간 판정은 Asia/Seoul 기준이므로, 호스트 타임존과 무관하게
 * dayjs.tz(...,'Asia/Seoul')로 고정 시각을 만들어 주입한다.
 * (2026-07 달력: 07-06=월, 일요일=05·12·19·26 → 각 1·2·3·4주차)
 */
import { describe, expect, it } from 'vitest';
import {
  freeSwimTimeSummary,
  freshnessLabel,
  getPoolNowStatus,
  isSessionToday,
  resolveSessionPrice,
  sortPoolsByStatus,
} from './pools';
import { dayjs } from './time';
import type { FreeSwimSession, Pool, PriceTiers } from './types';

const SEOUL = 'Asia/Seoul';

/** 요금표 픽스처 (하남 공통 요금) */
const FEES: PriceTiers = {
  full: { 성인: 3300, 청소년: 2750, 경로: 2640, 어린이: 2200, 장애유공자: 1650 },
  half: { 성인: 1650, 청소년: 1380, 경로: 1320, 어린이: 1100, 장애유공자: 830 },
};

/** 지정한 벽시계 시각(Asia/Seoul)의 Dayjs 생성 */
const at = (isoLocal: string) => dayjs.tz(isoLocal, SEOUL);

/** 세션 픽스처 — 필요한 필드만 최소 구성 */
const session = (over: Partial<FreeSwimSession> = {}): FreeSwimSession => ({
  daysLabel: '평일',
  dayCodes: [1, 2, 3, 4, 5],
  start: '06:00',
  end: '07:50',
  tier: 'full',
  ...over,
});

/** 세션 배열을 담은 최소 Pool 픽스처 */
const pool = (sessions: FreeSwimSession[], id = 'p'): Pool =>
  ({
    id,
    name: id,
    region: '미사',
    operator: 'test',
    phone: '',
    address: null,
    lat: null,
    lng: null,
    websiteUrl: '',
    sourceUrl: '',
    updatedAt: '2026-06-01',
    freeSwim: { sessions },
    lessons: [],
  }) as Pool;

describe('getPoolNowStatus', () => {
  // 월요일(2026-07-06) 06:00~07:50 세션 하나로 경계를 검증
  const p = pool([session({ start: '06:00', end: '07:50' })]);

  it('세션 진행 중이면 open + 종료시각', () => {
    const status = getPoolNowStatus(p, at('2026-07-06 06:30'));
    expect(status.kind).toBe('open');
    if (status.kind === 'open') {
      expect(status.endsAt).toBe('07:50');
      expect(status.session.start).toBe('06:00');
    }
  });

  it('시작 정각은 진행 중에 포함(start <= cur)', () => {
    const status = getPoolNowStatus(p, at('2026-07-06 06:00'));
    expect(status.kind).toBe('open');
  });

  it('종료 정각은 진행 중에서 제외(cur < end) → closed-today', () => {
    // 이후 세션이 없으므로 종료 정각엔 오늘 종료로 판정
    const status = getPoolNowStatus(p, at('2026-07-06 07:50'));
    expect(status.kind).toBe('closed-today');
  });

  it('세션 시작 전이면 soon + minsUntil 정확', () => {
    const status = getPoolNowStatus(p, at('2026-07-06 05:15'));
    expect(status.kind).toBe('soon');
    if (status.kind === 'soon') {
      expect(status.startsAt).toBe('06:00');
      expect(status.minsUntil).toBe(45);
    }
  });

  it('여러 세션 중 다음 세션까지 minsUntil 계산 (90분 초과 시 none-today)', () => {
    const multi = pool([
      session({ start: '06:00', end: '07:50' }),
      session({ start: '12:00', end: '12:50' }),
    ]);
    // 08:30 → 06:00 세션은 끝났고 다음은 12:00 (210분 뒤, 90분 초과)
    const status = getPoolNowStatus(multi, at('2026-07-06 08:30'));
    expect(status.kind).toBe('none-today');
  });

  it('여러 세션 중 다음 세션까지 minsUntil 계산 (90분 이내 시 soon)', () => {
    const multi = pool([
      session({ start: '06:00', end: '07:50' }),
      session({ start: '09:00', end: '09:50' }),
    ]);
    // 08:30 → 06:00 세션은 끝났고 다음은 09:00 (30분 뒤)
    const status = getPoolNowStatus(multi, at('2026-07-06 08:30'));
    expect(status.kind).toBe('soon');
    if (status.kind === 'soon') {
      expect(status.startsAt).toBe('09:00');
      expect(status.minsUntil).toBe(30);
    }
  });

  it('오늘 세션이 모두 끝났으면 closed-today', () => {
    const status = getPoolNowStatus(p, at('2026-07-06 23:00'));
    expect(status.kind).toBe('closed-today');
  });

  it('오늘 운영 세션이 없으면 none-today', () => {
    // 평일 세션뿐인 시설을 토요일(2026-07-11)에 조회
    const status = getPoolNowStatus(p, at('2026-07-11 10:00'));
    expect(status.kind).toBe('none-today');
  });
});

describe('isSessionToday', () => {
  it('dayCodes에 오늘 요일이 있으면 true', () => {
    const s = session({ dayCodes: [1, 2, 3, 4, 5] });
    expect(isSessionToday(s, at('2026-07-06 10:00'))).toBe(true); // 월
  });

  it('dayCodes에 오늘 요일이 없으면 false', () => {
    const s = session({ dayCodes: [1, 2, 3, 4, 5] });
    expect(isSessionToday(s, at('2026-07-11 10:00'))).toBe(false); // 토
  });

  it('weeksOfMonth [2,4] — 2주차 일요일은 true', () => {
    const s = session({ dayCodes: [0], weeksOfMonth: [2, 4] });
    expect(isSessionToday(s, at('2026-07-12 10:00'))).toBe(true); // 2주차 일
  });

  it('weeksOfMonth [2,4] — 1·3주차 일요일은 false', () => {
    const s = session({ dayCodes: [0], weeksOfMonth: [2, 4] });
    expect(isSessionToday(s, at('2026-07-05 10:00'))).toBe(false); // 1주차 일
    expect(isSessionToday(s, at('2026-07-19 10:00'))).toBe(false); // 3주차 일
  });

  it('weeksOfMonth [2,4] — 4주차 일요일은 true', () => {
    const s = session({ dayCodes: [0], weeksOfMonth: [2, 4] });
    expect(isSessionToday(s, at('2026-07-26 10:00'))).toBe(true); // 4주차 일
  });

  // weekOfMonth = ceil(date/7) 경계 (모든 요일 매칭 세션으로 주차 조건만 검증)
  it('weekOfMonth 경계 — 7일=1주차, 8일=2주차', () => {
    const wk1 = session({ dayCodes: [0, 1, 2, 3, 4, 5, 6], weeksOfMonth: [1] });
    expect(isSessionToday(wk1, at('2026-07-07 10:00'))).toBe(true); // 7일 → 1주차
    expect(isSessionToday(wk1, at('2026-07-08 10:00'))).toBe(false); // 8일 → 2주차
  });

  it('weekOfMonth 경계 — 28일=4주차, 29일=5주차', () => {
    const wk4 = session({ dayCodes: [0, 1, 2, 3, 4, 5, 6], weeksOfMonth: [4] });
    expect(isSessionToday(wk4, at('2026-07-28 10:00'))).toBe(true); // 28일 → 4주차
    expect(isSessionToday(wk4, at('2026-07-29 10:00'))).toBe(false); // 29일 → 5주차
  });
});

describe('freshnessLabel', () => {
  it('같은 날이면 "오늘 업데이트"', () => {
    expect(freshnessLabel('2026-07-09', at('2026-07-09 15:00'))).toBe(
      '오늘 업데이트',
    );
  });

  it('하루 전이면 "어제 업데이트"', () => {
    expect(freshnessLabel('2026-07-08', at('2026-07-09 15:00'))).toBe(
      '어제 업데이트',
    );
  });

  it('N일 전이면 "N일 전 업데이트"', () => {
    expect(freshnessLabel('2026-07-04', at('2026-07-09 15:00'))).toBe(
      '5일 전 업데이트',
    );
  });

  it('미래 날짜(diff<=0)면 "오늘 업데이트"로 폴백', () => {
    expect(freshnessLabel('2026-07-10', at('2026-07-09 15:00'))).toBe(
      '오늘 업데이트',
    );
  });
});

describe('resolveSessionPrice', () => {
  it('full tier → 전액 요금표', () => {
    const price = resolveSessionPrice(FEES, session({ tier: 'full' }));
    expect(price?.성인).toBe(3300);
    expect(price?.어린이).toBe(2200);
  });

  it('half tier → 반액 요금표', () => {
    const price = resolveSessionPrice(FEES, session({ tier: 'half' }));
    expect(price?.성인).toBe(1650);
    expect(price?.어린이).toBe(1100);
  });

  it('요금 데이터가 없으면 undefined', () => {
    expect(resolveSessionPrice(null, session({ tier: 'full' }))).toBeUndefined();
  });
});

describe('freeSwimTimeSummary', () => {
  const mon = at('2026-07-06 10:00'); // 월요일

  it("day='today' — 오늘 요일 세션을 시작시각 순으로 요약", () => {
    const p = pool([
      session({ start: '12:00', end: '12:50' }),
      session({ start: '06:00', end: '07:50' }),
    ]);
    expect(freeSwimTimeSummary(p, 'today', mon)).toBe(
      '06:00~07:50, 12:00~12:50',
    );
  });

  it("day='today' — weeksOfMonth 조건이 어긋나는 세션은 제외", () => {
    // 2·4주차 일요일 세션 — 1주차 일요일(07-05)엔 요약 없음
    const p = pool([session({ dayCodes: [0], weeksOfMonth: [2, 4] })]);
    expect(freeSwimTimeSummary(p, 'today', at('2026-07-05 10:00'))).toBeNull();
    expect(freeSwimTimeSummary(p, 'today', at('2026-07-12 10:00'))).toBe(
      '06:00~07:50',
    );
  });

  it('요일 코드 — 그 요일 세션만 요약(주차 조건은 근사상 무시)', () => {
    const p = pool([
      session({ dayCodes: [1, 2, 3], start: '06:00', end: '07:50' }),
      session({ dayCodes: [6], start: '09:00', end: '10:50' }),
    ]);
    expect(freeSwimTimeSummary(p, 6, mon)).toBe('09:00~10:50');
    expect(freeSwimTimeSummary(p, 3, mon)).toBe('06:00~07:50');
  });

  it('세션 3개 이상 → 앞 2개 + "외 N회"', () => {
    const p = pool([
      session({ start: '06:00', end: '07:50' }),
      session({ start: '09:00', end: '09:50' }),
      session({ start: '12:00', end: '12:50' }),
      session({ start: '15:00', end: '15:50' }),
    ]);
    expect(freeSwimTimeSummary(p, 1, mon)).toBe(
      '06:00~07:50, 09:00~09:50 외 2회',
    );
  });

  it('기준일 세션 0개 → null', () => {
    const p = pool([session({ dayCodes: [1, 2, 3, 4, 5] })]);
    expect(freeSwimTimeSummary(p, 6, mon)).toBeNull();
  });

  it('자유수영 정보 부재(listing) → null', () => {
    const p = { ...pool([]), freeSwim: null } as Pool;
    expect(freeSwimTimeSummary(p, 'today', mon)).toBeNull();
    expect(freeSwimTimeSummary(pool([]), 1, mon)).toBeNull();
  });
});

describe('sortPoolsByStatus', () => {
  const now = at('2026-07-06 06:30'); // 월요일 오전

  const openPool = pool([session({ start: '06:00', end: '07:50' })], 'open');
  const soonNear = pool([session({ start: '07:00', end: '07:50' })], 'soonNear'); // 30분 뒤
  const soonFar = pool([session({ start: '07:45', end: '08:50' })], 'soonFar'); // 75분 뒤 (soon 임계치 이내)
  const closedPool = pool([session({ start: '05:00', end: '06:00' })], 'closed');
  const nonePool = pool([session({ dayCodes: [6], start: '09:00', end: '10:50' })], 'none');

  it('open → soon(임박순) → closed-today → none-today 순 정렬', () => {
    const input = [nonePool, closedPool, soonFar, soonNear, openPool];
    const sorted = sortPoolsByStatus(input, now);
    expect(sorted.map((p) => p.id)).toEqual([
      'open',
      'soonNear',
      'soonFar',
      'closed',
      'none',
    ]);
  });

  it('원본 배열을 변형하지 않는다(불변)', () => {
    const input = [nonePool, openPool, soonNear];
    const before = [...input];
    sortPoolsByStatus(input, now);
    expect(input).toEqual(before);
    expect(input[0].id).toBe('none');
  });
});
