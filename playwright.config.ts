import { defineConfig, devices } from '@playwright/test';

/**
 * 배포 후 스모크 전용 설정(.github/workflows/smoke.yml).
 * 로컬 서버를 띄우지 않고 이미 배포된 URL(SMOKE_URL)을 그대로 본다.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  retries: 1, // 배포 직후 CDN 첫 요청 지연 대비
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: process.env.SMOKE_URL ?? 'https://oneul-swim.vercel.app',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [{ name: 'mobile-chromium', use: { ...devices['Pixel 7'] } }],
});
