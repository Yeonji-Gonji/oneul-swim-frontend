import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/constants/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 관리자·정책 잡페이지는 색인 제외
      disallow: ['/admin'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
