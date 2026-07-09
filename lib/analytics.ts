/**
 * 얇은 GA4 이벤트 헬퍼. NEXT_PUBLIC_GA_ID가 없어 gtag가 로드되지 않았으면 no-op.
 * 측정은 어디까지나 부가 기능이라, 어떤 상황에서도 앱 동작을 방해하지 않는다.
 */

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

/** 측정 이벤트 발화. gtag가 없으면(측정 미설정) 아무것도 하지 않는다. */
export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', name, params ?? {});
  } catch {
    /* 측정 실패는 조용히 무시 */
  }
}
