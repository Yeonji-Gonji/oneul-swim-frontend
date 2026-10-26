import { expect, test, type Page } from '@playwright/test';

/** 페이지 오류·콘솔 error 를 모은다. 서드파티(지도 SDK·분석) 소음은 제외한다. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  const ignore = /googletagmanager|google-analytics|dapi\.kakao\.com|daumcdn|favicon/i;
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !ignore.test(m.text() + (m.location().url ?? ''))) {
      errors.push(`console: ${m.text()}`);
    }
  });
  return errors;
}

test('홈: 200, 지도 퍼스트 화면과 수영장 개수 표시, 앱 오류 없음', async ({ page }) => {
  const errors = collectErrors(page);
  const res = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/오늘수영/);
  await expect(page.getByText(/수영장\s*[\d,]+곳/).first()).toBeVisible({ timeout: 20_000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('시설 목록: 200, 상세 링크가 있다', async ({ page }) => {
  const errors = collectErrors(page);
  const res = await page.goto('/pools', { waitUntil: 'domcontentloaded' });
  expect(res?.status()).toBe(200);
  await expect(page.locator('a[href^="/pool"]').first()).toBeAttached();
  expect(errors, errors.join('\n')).toEqual([]);
});

test('정의되지 않은 경로는 홈으로 이동한다(catch-all)', async ({ page }) => {
  // 루트 loading.tsx 때문에 응답이 스트리밍으로 먼저 나가 307 이 아니라 200 + meta refresh(1초)로 이동한다.
  await page.goto('/zzz-nonexistent-control', { waitUntil: 'domcontentloaded' });
  await page.waitForURL((url) => url.pathname === '/', { timeout: 10_000 });
});
