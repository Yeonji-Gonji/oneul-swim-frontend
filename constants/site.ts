/**
 * 사이트 전역 설정 — 메타데이터·사이트맵·robots·OG·JSON-LD가 공유하는 단일 출처.
 * 배포 도메인은 Vercel 환경변수 NEXT_PUBLIC_SITE_URL로 주입(미설정 시 폴백).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://oneul-swim.vercel.app'
).replace(/\/$/, '');

export const SITE_NAME = '오늘수영';

export const SITE_TAGLINE = '지금 갈 수 있는 자유수영장';

export const SITE_DESCRIPTION =
  '전국 수영장의 자유수영 시간과 요금을 한눈에. 지금 이 시간 자유수영 가능한 곳을 지역별로 찾아보세요.';
