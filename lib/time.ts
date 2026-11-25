/**
 * 시간 유틸 — 모든 "지금 상태" 판정은 Asia/Seoul 기준.
 * dayjs(utc+timezone)로 호스트 타임존과 무관하게 한국 벽시계 시각을 얻는다.
 */
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const SEOUL_TZ = 'Asia/Seoul';

/** 현재 시각(Asia/Seoul). 서버/클라 어디서든 동일 기준. */
export function nowInSeoul(): Dayjs {
  return dayjs().tz(SEOUL_TZ);
}

export { dayjs };
export type { Dayjs };
