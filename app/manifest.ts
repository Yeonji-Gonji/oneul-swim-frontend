import type { MetadataRoute } from 'next';

/** PWA manifest — 홈화면 추가 시 '오늘수영' 앱처럼 동작 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: '오늘수영 — 하남 자유수영',
    short_name: '오늘수영',
    description: '지금 하남에서 자유수영 갈 수 있는 곳을 한눈에.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'ko',
    dir: 'ltr',
    categories: ['sports', 'lifestyle', 'health'],
    background_color: '#F4F5F6',
    theme_color: '#0E7C86',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
