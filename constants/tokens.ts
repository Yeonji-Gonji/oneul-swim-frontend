/**
 * 디자인 토큰 — Figma "수영장앱 MVP" / 🎨 Foundations 미러
 * file: vkvQWjSmUg31avUacMi2e9 (node 0:1)
 *
 * ⚠️ 이 파일은 Figma Foundations의 단일 미러본이다.
 *    Foundations가 바뀌면 get_metadata로 재읽기 → 여기 갱신 → tailwind.config 자동 반영.
 *    아레사 토큰 골격 상속 + Primary만 워터블루 재테마.
 */

export const colors = {
  primary: {
    default: '#0E7C86', // 워터블루 — 주 액션/브랜드
    strong: '#0A5F67', // press/active
    blue: '#2E9BD6', // 보조 (그라데이션·강조)
    10: '#E5F4F5', // 옅은 배경 틴트
    5: '#F2FAFA', // 더 옅은 배경
  },
  text: {
    default: '#2A2D34',
    sub: '#9797A0',
  },
  line: {
    10: '#EAEAEC',
  },
  bg: {
    normal: '#F4F5F6',
  },
  surface: {
    white: '#FFFFFF',
  },
  /** 앱 핵심 규약 — getPoolNowStatus()의 상태와 1:1 매핑 */
  state: {
    nowOpen: '#2DB16B', // 🟢 open      — 지금 자유수영 중
    upcoming: '#F0A231', // 🟡 soon      — 곧 시작
    closed: '#9797A0', // ⚪ closed/none — 오늘 종료·미운영
    error: '#C80000', // 위치권한 거부·로드 실패
  },
} as const;

/** 타이포 스케일 (px). Bold 기준, letter-spacing -4% (-0.04em), Pretendard → Noto Sans KR 폴백 */
export const fontSize = {
  h1: 28,
  h2: 24,
  h3: 20,
  body: 16,
  sm: 14,
  xs: 12,
  micro: 10,
} as const;

export const fontFamily =
  "'Pretendard', 'Noto Sans KR', -apple-system, sans-serif";

export const letterSpacing = '-0.04em';

/** 라운드 (메모리 디자인 메모: 버튼8 / 인풋12 / 시트14) */
export const radius = {
  button: 8,
  input: 12,
  sheet: 14,
} as const;

import type { NowStatus } from '../lib/pools';

/** NowStatus → 상태 토큰 키. UI(StatusBadge)가 이 한 곳만 참조하면 됨. */
export const statusToToken = (
  kind: NowStatus['kind'],
): keyof typeof colors.state => {
  switch (kind) {
    case 'open':
      return 'nowOpen';
    case 'soon':
      return 'upcoming';
    case 'closed-today':
    case 'none-today':
    case 'listing':
      return 'closed';
  }
};
