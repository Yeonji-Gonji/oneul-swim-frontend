import { defineConfig } from 'vitest/config';

// 순수 lib 로직 단위 테스트 전용 설정.
// DOM 불필요 → node 환경. 테스트는 상대경로 import 라 별칭 설정도 불필요.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['lib/**/*.test.ts'],
  },
});
