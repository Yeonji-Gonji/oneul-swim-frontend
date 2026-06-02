'use client';

import { useEffect } from 'react';

/** /sw.js 를 등록하는 클라이언트 전용 컴포넌트. PWA 오프라인 지원·설치 가능 조건 충족용. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('[PWA] Service Worker 등록 실패', err);
      });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
