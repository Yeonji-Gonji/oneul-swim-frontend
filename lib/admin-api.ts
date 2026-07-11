/**
 * 미니 어드민 공용 타입 & 요청 함수 시그니처.
 * 토큰은 sessionStorage에만 두고(하드코딩·번들 노출 금지) 페이지가 Bearer로 주입한다.
 */

export interface AdminReport {
  id: string;
  poolId: string;
  reason: string;
  content: string;
  status: 'PENDING' | 'APPLIED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
}

export interface FreshnessAlert {
  id: string;
  url: string;
  detectedAt: string;
  resolved: boolean;
}

/** 어드민 인증 fetch — 페이지가 토큰을 주입해 만들고 각 섹션에 내려준다.
 *  401이면 페이지가 토큰을 지우고 재로그인 폼으로 되돌린다. */
export type AdminRequest = (
  path: string,
  init?: RequestInit,
) => Promise<Response>;

/** 자유수영 세션 1건 — 백엔드 ScheduleDraft.sessions 원소(프론트 FreeSwimSession 과 동일 shape) */
export interface DraftSession {
  daysLabel: string;
  dayCodes: number[];
  start: string;
  end: string;
  tier: 'full' | 'half';
  weeksOfMonth?: number[];
  capacity?: number;
  pool?: string;
}

/** 시간표 AI 초안(검수 큐 1건) */
export interface ScheduleDraft {
  id: string;
  poolId: string;
  poolName: string;
  sessions: DraftSession[];
  laneInfo: string;
  notice: string;
  sourceContext: string;
  sourceQuery: string;
  confidence: 'low' | 'medium' | 'high';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt?: string | null;
}

export const DRAFT_STATUS_LABEL: Record<ScheduleDraft['status'], string> = {
  PENDING: '검수 대기',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

export const ADMIN_TOKEN_KEY = 'oneul-swim:admin-token';

/**
 * 카카오 인가 URL. 로그인 후 code 를 붙여 redirectUri 로 돌아온다.
 * client_id 는 카카오 REST 키(공개용). 백엔드가 code 를 검증해 본인 계정만 토큰 발급.
 */
export const kakaoAuthorizeUrl = (restKey: string, redirectUri: string): string =>
  `https://kauth.kakao.com/oauth/authorize?client_id=${encodeURIComponent(
    restKey,
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

export const REPORT_STATUSES = ['PENDING', 'APPLIED', 'REJECTED'] as const;

export const STATUS_LABEL: Record<AdminReport['status'], string> = {
  PENDING: '확인 중',
  APPLIED: '반영됨',
  REJECTED: '반영 불가',
};
