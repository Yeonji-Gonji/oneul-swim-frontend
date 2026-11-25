# 오늘수영 (oneul-swim)

전국 공공 수영장의 **지금 자유수영 가능 여부 · 시간표 · 요금 · 위치**를 지도에서 한눈에 보여주는 PWA.
배포: https://oneul-swim.vercel.app · 목표·스택: [docs/PROJECT.md](docs/PROJECT.md)

- **스택**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Kakao Maps · PWA
- **데이터**: 백엔드 API `GET /pools` 우선, 정적 JSON(`data/pools.json`) 폴백
- **패키지 매니저**: pnpm

## 개발

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

환경변수는 `.env.local` 에 둔다.

```bash
NEXT_PUBLIC_KAKAO_MAP_KEY=<카카오 JavaScript 키>
NEXT_PUBLIC_KAKAO_REST_KEY=<카카오 REST 키 (어드민 카카오 로그인)>
NEXT_PUBLIC_API_URL=<oneul-swim-backend 주소, 예: https://api.example.com>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<백엔드와 짝인 Web Push 공개키>
NEXT_PUBLIC_SITE_URL=<배포 도메인, 로컬은 생략 가능>
NEXT_PUBLIC_GA_ID=<GA4 측정 ID, 선택>
```

### 환경변수와 폴백

전부 `NEXT_PUBLIC_*` 라 빌드 시 번들에 인라인된다. Vercel 에서는 Production + Preview 에 등록하고, 값을 바꾸면 재배포해야 반영된다. 키가 없어도 앱은 빌드·구동된다.

| 키                             | 역할                          | 없을 때                                                       |
| ------------------------------ | ----------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`         | 메타·사이트맵·OG 의 기준 URL  | `https://oneul-swim.vercel.app` 폴백                          |
| `NEXT_PUBLIC_API_URL`          | 백엔드 API 주소               | 정적 `data/pools.json` 폴백, 제보는 전송 없이 접수 UX 만 동작 |
| `NEXT_PUBLIC_KAKAO_MAP_KEY`    | 카카오 지도 JavaScript 키     | 지도 대신 권역 핀 버튼 폴백                                   |
| `NEXT_PUBLIC_KAKAO_REST_KEY`   | 어드민 카카오 로그인(REST 키) | 어드민은 토큰 직접 입력 폴백                                  |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push 공개키(백엔드와 짝)  | 아침 요약 토글이 "서버 준비 중" 안내                          |
| `NEXT_PUBLIC_GA_ID`            | GA4 측정 ID(선택)             | 계측 비활성                                                   |

- **폴백 원칙**: API·카카오 키 장애 시에도 정적 `data/pools.json` 으로 항상 동작한다. 홈·시설 상세는 `GET /pools` 우선(force-dynamic) + 정적 폴백(`lib/pools-data.ts`).

## 스크립트

| 명령              | 설명                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`        | 개발 서버                                                                                                          |
| `pnpm build`      | 프로덕션 빌드                                                                                                      |
| `pnpm start`      | 빌드 결과 실행                                                                                                     |
| `pnpm lint`       | ESLint                                                                                                             |
| `pnpm typecheck`  | `tsc --noEmit` 타입 검사                                                                                           |
| `pnpm test`       | vitest 단위테스트(`lib/pools.test.ts`·`lib/regions.test.ts`)                                                       |
| `pnpm check`      | PR 을 올리기 전에 돌리는 일괄 검사. lint → typecheck → test → build 순서이고 CI 가 같은 명령을 돌린다              |
| `pnpm format`     | Prettier 로 고치기. 검사만 하려면 `pnpm format:check`. 제외 목록은 `.prettierignore`(`docs/`·`data/`·`public/`)    |
| `pnpm test:smoke` | 배포된 URL(`SMOKE_URL`)에 Playwright 스모크. 수동 실행은 `SMOKE_URL=https://oneul-swim.vercel.app pnpm test:smoke` |

## 구조

| 영역            | 경로 / 모듈                                                                               | 역할 및 고정 규칙                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 홈(지도 퍼스트) | `app/page.tsx`, `components/map/`(MapExplorer·MapSheet·필터 3종)                          | geolocation + 상태색 마커 + 클러스터 + 3단 바텀시트. `/map` 은 홈으로 리다이렉트                                        |
| 시설 목록·상세  | `app/pools/[sido]/[sigungu]`, `app/pool/[id]`, `components/pool/`                         | SEO 용 정적 목록 + 상세. 데이터는 `lib/pools-data.ts`(API 우선 → 정적 폴백)                                             |
| 상태 판정       | `lib/pools.ts`, `lib/time.ts`, `lib/regions.ts`                                           | "지금 운영 중·곧 시작" 규칙. 단위테스트 대상                                                                            |
| 제보            | `app/reports/`, `lib/report-api.ts`, `components/report/`                                 | `POST /reports` 로 전송. API 없으면 접수 UX 만                                                                          |
| 푸시·알림       | `lib/push.ts`, `components/ServiceWorkerRegister.tsx`, `public/sw.js`, `app/lessons/`     | VAPID 구독, 아침 요약·강습 접수 소식                                                                                    |
| 미니 어드민     | `app/admin/`, `lib/admin-api.ts`, `components/admin/`                                     | 제보 처리·시설/요금 수정·신선도 알림·접수소식 발송. 로그인 = 카카오(본인 계정만 백엔드가 토큰 발급) 또는 토큰 직접 입력 |
| SEO·메타        | `constants/site.ts`, `components/seo/`, `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt` | 단일 출처 = `constants/site.ts`                                                                                         |
| 디자인 토큰     | `app/globals.css`(@theme), `constants/tokens.ts`                                          | 토큰 단일 소스는 `globals.css`. 다크모드 = `prefers-color-scheme` + `[data-theme]` 훅                                   |
| 계측            | `components/analytics/`, `lib/analytics.ts`                                               | `NEXT_PUBLIC_GA_ID` 게이트. 이벤트 `report_submit`·`push_subscribe`                                                     |

## 운영 함정

- **카카오 지도 도메인**: 카카오 개발자 콘솔 "Web 플랫폼 도메인"에 배포 도메인이 등록돼야 한다. 미등록이면 401 → 폴백 화면이 뜨고 에러는 브라우저 콘솔에만 남는다(등록 방법은 아래 "카카오 도메인 등록").
- **어드민 카카오 로그인**: 콘솔의 "카카오 로그인" 활성화 + Redirect URI(`<도메인>/admin`, `http://localhost:3000/admin`) 등록이 필요하다. `/admin` 은 noindex 이고, 토큰 직접 입력으로 들어갈 때 Bearer 토큰은 백엔드 `ADMIN_TOKEN` 과 같아야 한다.
- **하이드레이션**: 브라우저 전용 판정(`isPushSupported()` 등)은 렌더 중에 하지 말고 `useSyncExternalStore` 게이트로 클라이언트에서만 평가한다(React #418 재발 방지, 참조 구현 `app/more/page.tsx`).

## CI/CD

- **CI**: `.github/workflows/ci.yml`. PR 과 `main` 푸시마다 잡 하나(`Lint · Typecheck · Test · Build`, main 룰셋 `main-pr-ci` 의 필수 체크)가 **포맷 검사 → `pnpm check`(lint → typecheck → test → build)** 를 돌린다. 포맷 검사는 늘 돌고, `docs/` 와 `*.md` 만 바꾼 변경은 `pnpm check` 를 건너뛴다.
- **배포**: Vercel Git 연동, main 머지 = 운영 배포. main 직접 push 대신 브랜치 → PR → CI 통과 → 머지. PR 마다 프리뷰 URL 생성.
- **배포 후 스모크**: `.github/workflows/smoke.yml` 이 Vercel Production 배포 성공마다 운영 URL 에 Playwright(`e2e/smoke.spec.ts`)로 홈 렌더·수영장 개수·앱 오류 0·시설 목록·catch-all 이동을 확인한다. 실패하면 Actions 실패 메일.

### Vercel 최초 연동 (1회)

1. [vercel.com/new](https://vercel.com/new) → `Yeonji-Gonji/oneul-swim-frontend` Import (프레임워크 Next.js 자동 감지, 빌드 설정 그대로).
2. **Environment Variables** 에 위 "환경변수와 폴백" 표의 키를 추가 (Production · Preview).
3. Deploy. 이후 푸시마다 자동 배포.

### 카카오 도메인 등록

[Kakao Developers](https://developers.kakao.com) → 내 애플리케이션 → 플랫폼 → Web 사이트 도메인에 배포 도메인(`https://<프로젝트>.vercel.app` 및 커스텀 도메인)을 추가해야 지도가 뜬다.

### GitHub Actions 시크릿 (선택)

CI 빌드에서도 지도 키를 쓰려면 리포지토리 **Settings → Secrets → Actions** 에 `NEXT_PUBLIC_KAKAO_MAP_KEY` 등록. 미등록이어도 빌드는 통과한다.
