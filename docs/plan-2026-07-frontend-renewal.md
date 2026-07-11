# 프론트 리뉴얼 로드맵 (2026-07)

백엔드는 전국 606곳까지 확장됐으나 프론트가 하남 기준에 머물러 있어, 프론트를 5개 워크스트림으로 끌어올린다. 순서는 저위험 고효율 우선.

## 확정 방향 (2026-07-11 사용자 확인)

- **GEO** = Generative Engine Optimization(AI 검색 인용 최적화). item 1은 표준 SEO(지역 페이지·구조화데이터·사이트맵)를 먼저 깔고 그 위에 GEO 레이어를 얹는다.
- **로그인** = 개인화 알림용. 기존 익명 deviceId 푸시를 계정 기반으로 승격 + 즐겨찾기 수영장의 자유수영/요금 변동 푸시. 백엔드 User 모델은 여기에 맞춰 최소로.
- **순서** = 저위험 고효율 먼저(A~C 프론트 단독 → D 로그인 → E 스토어).
- 도메인: `https://oneul-swim.vercel.app`, Vercel 빌드에 `NEXT_PUBLIC_API_URL=https://oneul-swim.duckdns.org` 설정됨(프로덕션 빌드는 606곳 지역 페이지 생성, 로컬/CI는 폴백 4곳).

## Phase A: SEO + GEO — 완료 (2026-07-11)

프론트 단독, 백엔드 무관. 검증: typecheck/lint/test(28)/build 그린.

- `constants/site.ts`: 사이트 전역 상수 단일 출처(SITE_URL=env 폴백).
- `app/layout.tsx`: 메타데이터 전국화(metadataBase, title.template, openGraph, keywords). `app/manifest.ts` 문구 전국화.
- `app/robots.ts`, `app/sitemap.ts`(홈·/pools·시도·시군구·전 시설 lastModified).
- 지역 라우트(ISR 1h): `app/pools/page.tsx`(전국 인덱스) → `app/pools/[sido]` → `app/pools/[sido]/[sigungu]`. 한글 세그먼트, generateStaticParams, notFound.
- `lib/regions.ts`(+테스트 6): 시도/시군구 집계 순수 유틸.
- `components/seo/JsonLd.tsx`: XSS 안전(< 이스케이프) + null prune. 상세=SportsActivityLocation, 지역=FAQPage, 홈=WebSite.
- `app/pool/[id]/page.tsx`: generateMetadata(답변형 상태 문장) + JSON-LD. force-dynamic 유지.
- GEO: `app/llms.txt/route.ts`(서비스 요약·데이터 출처·주요 페이지 절대URL), 지역 페이지 답변형 요약 문단.

## Phase B: 디자인 리뉴얼 (iOS 레퍼런스) — 예정

토큰 개편(iOS풍 라운드·타입·반투명 blur·elevation + 다크모드, safe-area inset), 컴포넌트 일괄(바텀시트·탭바·카드·칩·버튼), tokens.ts↔Figma 미러 갱신.

## Phase C: UX & 인터랙션 고도화 — 예정

스프링 전환·View Transitions, 스켈레톤 로딩, pull-to-refresh, 낙관적 UI, listing(정보 준비중) 빈 상태 개선.

## Phase D: 카카오 로그인 (개인화 알림) — 예정 (프론트+백엔드)

백엔드: User 모델, 카카오 OAuth, 익명 푸시→계정 연결, 즐겨찾기 + 시설별 알림 구독, 변동 감지 크론. 프론트: 로그인 플로우(선택 로그인, 익명 유지), 즐겨찾기·알림 설정.
⚠️ 사용자 작업: 카카오 디벨로퍼스 앱 등록(REST 키·redirect URI·동의항목).

## Phase E: 플레이스토어 (TWA) — 예정

`docs/twa-release.md` 골격 존재. Bubblewrap 빌드, 서명 SHA256→assetlinks, 스토어 등록물.
⚠️ 사용자 작업: Google Play Console 계정($25 1회), 서명키.
