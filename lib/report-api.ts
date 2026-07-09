/**
 * 제보 API 클라이언트. NEXT_PUBLIC_API_URL이 없거나 서버가 죽어 있어도
 * 앱은 동작해야 하므로(정적 MVP 폴백 원칙) 실패를 던지지 않고 결과로 알린다.
 */

import { trackEvent } from './analytics';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const DEVICE_ID_KEY = 'oneul-swim:device-id';

/** 익명 기기 식별자. 회원가입 없이 "내 제보 내역"을 묶는 용도 */
export function getDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export type SubmitReportResult =
  | { ok: true }
  | { ok: false; reason: 'no-backend' | 'network' };

export async function submitReport(input: {
  poolId: string;
  reason: string;
  content: string;
}): Promise<SubmitReportResult> {
  if (!API_URL) return { ok: false, reason: 'no-backend' };

  try {
    const res = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, deviceId: getDeviceId() }),
    });
    if (!res.ok) return { ok: false, reason: 'network' };
    // 측정: 제보 제출 성공 (GA 미설정 시 no-op)
    trackEvent('report_submit', { poolId: input.poolId, reason: input.reason });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
