import type { Metadata } from 'next';

/** 어드민은 내부 운영 도구 — 검색엔진 비노출(noindex) */
export const metadata: Metadata = {
  title: '오늘수영 어드민',
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
