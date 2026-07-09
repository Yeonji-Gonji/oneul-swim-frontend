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

export const ADMIN_TOKEN_KEY = 'oneul-swim:admin-token';

export const REPORT_STATUSES = ['PENDING', 'APPLIED', 'REJECTED'] as const;

export const STATUS_LABEL: Record<AdminReport['status'], string> = {
  PENDING: '확인 중',
  APPLIED: '반영됨',
  REJECTED: '반영 불가',
};
