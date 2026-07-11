import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/constants/site';
import './globals.css';

// Pretendard는 Google Fonts 미제공 → Noto Sans KR 로드, CSS 스택에서 Pretendard 우선.
const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-kr',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 지금 갈 수 있는 자유수영장`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ['자유수영', '수영장', '자유수영 시간표', '실내수영장', '오늘수영'],
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: SITE_NAME },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'ko_KR',
    url: SITE_URL,
    title: `${SITE_NAME} — 지금 갈 수 있는 자유수영장`,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: '#0E7C86',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <ServiceWorkerRegister />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
