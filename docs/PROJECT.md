---
project: oneul-swim-frontend
type: project-status
status: 운영
updated: 2026-10-26
---

# PROJECT: oneul-swim-frontend 온보딩 시트

> **이 문서는 리포 온보딩·아키텍처·고정 함정 시트다.**
> - **현재 라이브 배포 기준**: Vercel 대시보드(Production 배포 = main 최신 커밋) · `git log`
> - **남은 일·결정 필요**: GitHub Issues (리포 점검 체크리스트 = "허브 기준 점검 2026-10-26" 이슈)
> - **변경 이력·왜 그렇게 정했는지**: `git log`·PR, 기획 로드맵 [plan-2026-07-frontend-renewal.md](plan-2026-07-frontend-renewal.md) · [plan-2026-07-enhancement.md](plan-2026-07-enhancement.md)
> - 2026-07-31 이전 현황판은 [archive/status-2026-07-31.md](archive/status-2026-07-31.md)(작성 시점 값으로 고정). 이 문서에는 날짜별 진행 상태를 적지 않는다.

## 요약

전국 공공 수영장(약 600곳)의 자유수영 정보(지금 가능 여부·시간표·요금·위치)를 보여주는 PWA. 홈은 내 위치 기반 지도 퍼스트 화면이고,
제보·아침 요약 푸시·강습 접수 소식 알림은 백엔드 API([oneul-swim-backend](https://github.com/Yeonji-Gonji/oneul-swim-backend))와 연동한다.

## 핵심 사양

- **스택**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Kakao Maps SDK · Web Push · PWA(manifest·sw.js)
- **패키지 매니저 / dev 포트**: pnpm / `pnpm dev` → http://localhost:3000
- **도메인 / 배포 타겟**: `https://oneul-swim.vercel.app` (Vercel, main push 자동 배포. `NEXT_PUBLIC_SITE_URL` 로 도메인 주입)
- **백엔드 API**: `NEXT_PUBLIC_API_URL` = `https://oneul-swim.duckdns.org` (`GET /pools`, 제보, 구독)
- **테스트**: vitest (`lib/pools.test.ts`·`lib/regions.test.ts`) · CI = `.github/workflows/ci.yml`(lint → typecheck → test → build, PR·main)

## 배포 · 환경 구조 (고정 규칙 및 함정)

- **배포 방식**: Vercel Git 연동. main 머지가 곧 운영 배포이므로 main 에 직접 push 하지 않고 브랜치 → PR → CI 통과 → 머지.
  Preview 배포는 PR 마다 자동.
- **런타임 환경변수(Vercel Production + Preview 에 등록)**: 전부 `NEXT_PUBLIC_*` 라 빌드 시 인라인된다. 값을 바꾸면 재배포가 필요하다.

  | 키 | 역할 | 없을 때 |
  |---|---|---|
  | `NEXT_PUBLIC_SITE_URL` | 메타·사이트맵·OG 의 기준 URL | `https://oneul-swim.vercel.app` 폴백 |
  | `NEXT_PUBLIC_API_URL` | 백엔드 API 주소 | 정적 `data/pools.json` 폴백, 제보는 UX 만 동작 |
  | `NEXT_PUBLIC_KAKAO_MAP_KEY` | 카카오 지도 JavaScript 키 | 지도 대신 권역 핀 버튼 폴백 |
  | `NEXT_PUBLIC_KAKAO_REST_KEY` | 어드민 카카오 로그인(REST 키) | 어드민은 토큰 직접 입력 폴백 |
  | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push 공개키(백엔드와 짝) | 아침 요약 토글이 "서버 준비 중" 안내 |
  | `NEXT_PUBLIC_GA_ID` | GA4 측정 ID(선택) | 계측 비활성 |

- **폴백 원칙**: API·카카오 키 장애 시에도 정적 `data/pools.json` 으로 항상 동작한다. 홈·지도·시설 상세는 `GET /pools` 우선(force-dynamic) + 정적 폴백.
- **운영·검증 함정**
  - 카카오 지도 키는 카카오 개발자 콘솔 "Web 플랫폼 도메인"에 배포 도메인이 등록돼야 한다. 미등록이면 401 → 폴백 화면이 뜨고 에러는 콘솔에만 남는다.
  - 어드민 카카오 로그인은 콘솔의 "카카오 로그인" 활성화 + Redirect URI(`<도메인>/admin`, `http://localhost:3000/admin`) 등록이 필요하다.
  - `/admin` 은 noindex. Bearer 토큰은 백엔드 `ADMIN_TOKEN` 과 같아야 한다.
  - 배포 후 확인: 홈 지도 타일·마커·바텀시트 렌더, 브라우저 콘솔 에러 0, `curl -s https://oneul-swim.vercel.app | grep -c '오늘수영'` 이 1 이상.
  - 하이드레이션 함정: 브라우저 전용 판정(`isPushSupported()` 등)은 렌더 중에 하지 말고 `useSyncExternalStore` 게이트로 클라이언트에서만 평가한다(React #418 재발 방지).
- **TWA(안드로이드 스토어)**: 절차 = [twa-release.md](twa-release.md). `public/.well-known/assetlinks.json` 은 서명 지문 자리표시자 상태.

## 아키텍처 · 기능 모듈 지도

| 영역 | 경로 / 모듈 | 역할 및 고정 규칙 |
| --- | --- | --- |
| 홈(지도 퍼스트) | `app/page.tsx`, `components/map/`(MapExplorer·MapSheet·필터 3종) | geolocation + 상태색 마커 + 클러스터 + 3단 바텀시트. `/map` 은 홈으로 리다이렉트 |
| 시설 목록·상세 | `app/pools/[sido]/[sigungu]`, `app/pool/[id]`, `components/pool/` | SEO 용 정적 목록 + 상세. 데이터는 `lib/pools-data.ts`(API 우선 → 정적 폴백) |
| 상태 판정 | `lib/pools.ts`, `lib/time.ts`, `lib/regions.ts` | "지금 운영 중·곧 시작" 규칙. 단위테스트 대상 |
| 제보 | `app/reports/`, `lib/report-api.ts`, `components/report/` | `POST /reports` 로 전송. API 없으면 접수 UX 만 |
| 푸시·알림 | `lib/push.ts`, `components/ServiceWorkerRegister.tsx`, `public/sw.js`, `app/lessons/` | VAPID 구독, 아침 요약·강습 접수 소식 |
| 미니 어드민 | `app/admin/`, `lib/admin-api.ts`, `components/admin/` | 제보 처리·시설/요금 수정·신선도 알림·접수소식 발송·시간표 초안 검수 |
| SEO·메타 | `constants/site.ts`, `components/seo/`, `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt` | 단일 출처 = `constants/site.ts` |
| 디자인 토큰 | `app/globals.css`(@theme), `constants/tokens.ts` | 토큰 단일 소스는 `globals.css`. 다크모드 = `prefers-color-scheme` + `[data-theme]` 훅 |
| 계측 | `components/analytics/`, `lib/analytics.ts` | `NEXT_PUBLIC_GA_ID` 게이트. 이벤트 `report_submit`·`push_subscribe` |

## 참고 / 외부 링크

- 백엔드: [oneul-swim-backend](https://github.com/Yeonji-Gonji/oneul-swim-backend) (`docs/OPERATIONS.md` 에 서버 운영 절차)
- 이슈 추적: GitHub Issues
- 의사결정 기록: `docs/adr/` (첫 ADR 작성 시 생성. 리뉴얼 당시 ADR-001~009 는 리포 밖에 있어 이 리포에서는 찾을 수 없다)
