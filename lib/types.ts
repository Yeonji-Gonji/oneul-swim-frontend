/**
 * 오늘수영(oneul-swim) — 공통 데이터 스키마
 *
 * 데이터 출처: 하남도시공사 hanamsport.or.kr 각 시설 /program/ 정형 HTML 표 (2026-06-01 크롤링).
 * 요금/시간표는 분기·시즌마다 변동 → pool.updatedAt 으로 신선도 관리, 변경 시 재크롤링.
 */

/** 요일 코드: JS Date.getDay() 기준 (0=일 … 6=토) */
export type DayCode = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 자유수영 요금 등급 — 시설 공통. 세션이 어느 tier인지만 참조한다. */
export type FreeSwimTier = 'full' | 'half';

/** 대상별 요금표 (원) */
export interface PriceByTarget {
  성인: number;
  청소년: number;
  경로: number;
  어린이: number;
  장애유공자: number;
}

/** 자유수영 세션 1건 (요일×시간대) */
export interface FreeSwimSession {
  /** 표시용 요일 레이블 (예: "월~금", "토", "일", "금") */
  daysLabel: string;
  /** 뱃지 계산용 요일 코드 배열 */
  dayCodes: DayCode[];
  /** 특정 주차에만 운영할 때 (예: 둘째·넷째 주 일요일 → [2,4]). 매주면 생략 */
  weeksOfMonth?: number[];
  /** "HH:mm" 24h */
  start: string;
  end: string;
  /** 이용풀 (예: "50m", "25m", "25m,50m") — 미제공 시 생략 */
  pool?: string;
  /** 정원 — 미제공 시 생략 */
  capacity?: number;
  /** 요금 등급 → 시설 공통 priceTiers 참조 */
  tier: FreeSwimTier;
  note?: string;
}

/** 강습 프로그램 (v1: 개요 노출, v1.5: 신청·등록일 확장) */
export interface LessonProgram {
  name: string;
  daysLabel: string;
  time: string;
  capacity?: string;
  /** 월 강습료 (원). 요일/대상별로 갈리면 note 로 보충 */
  fee: number;
  note?: string;
}

/** 월정기 자유수영권 (시설별 유무 상이) */
export interface MonthlyPass {
  성인: number;
  청소년: number;
  어린이: number;
  note?: string;
}

/** 요금표: 전액(full)/반액(half) 대상별 금액. 시설마다 대상 구성이 달라 Partial */
export type PriceTiers = Record<FreeSwimTier, Partial<PriceByTarget>>;

/** 데이터 완비 수준: listing=기본정보만, full=자유수영·요금까지 */
export type DataStatus = 'listing' | 'full';

export interface Pool {
  id: string;
  name: string;
  /** 광역(시도)/기초(시군구) — 전국 필터 기준. 벌크 임포트 시 채움 */
  sido?: string | null;
  sigungu?: string | null;
  /** 표시용 세부 지역 라벨(예: "미사"). 필수 아님 */
  region?: string | null;
  operator: string;
  phone: string;
  /** 주소·위경도 */
  address: string | null;
  lat: number | null;
  lng: number | null;
  laneInfo?: string;
  /** 운영시간/휴관/브레이크타임/유의사항 등 표시용 비정형 텍스트 */
  notice?: string;
  websiteUrl: string;
  sourceUrl: string;
  /** ISO date — "N일 전 업데이트" 계산용 (신뢰 장치) */
  updatedAt: string;
  /** 자유수영 정보. 리스팅 전용(기본정보만) 시설은 null */
  freeSwim: {
    sessions: FreeSwimSession[];
    monthlyPass?: MonthlyPass;
  } | null;
  lessons: LessonProgram[] | null;
  /** 시설별 자유수영 요금표. 데이터 없으면 null */
  fees?: PriceTiers | null;
  /** "listing" | "full". 미지정 시 데이터 유무로 추정 */
  dataStatus?: DataStatus;
}

export interface PoolsData {
  /**
   * @deprecated 요금은 pool.fees 로 이동. 백엔드가 이행기 동안 대표 요금표를
   * top-level 에도 함께 실어 주므로 optional 로만 남긴다(Phase 3 이후 제거).
   */
  freeSwimPriceTiers?: Record<FreeSwimTier, PriceByTarget>;
  pools: Pool[];
}
