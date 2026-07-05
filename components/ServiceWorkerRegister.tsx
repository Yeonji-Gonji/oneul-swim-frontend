'use client';

import { useEffect } from 'react';

/** /sw.js 를 등록하는 클라이언트 전용 컴포넌트. PWA 오프라인 지원·설치 가능 조건 충족용. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('[PWA] Service Worker 등록 실패', err);
      });
    };
    // 하이드레이션이 load 이후에 끝나면 load 리스너는 영영 안 불린다 —
    // 이미 로드가 끝난 상태면 즉시 등록한다
    if (document.readyState === 'complete') {
      register();
      return;
    }
    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
