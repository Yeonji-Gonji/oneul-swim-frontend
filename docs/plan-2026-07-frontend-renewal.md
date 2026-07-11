# 프론트 리뉴얼 로드맵 (2026-07)

백엔드는 전국 606곳까지 확장됐으나 프론트가 하남 기준에 머물러 있어, 프론트를 6개 워크스트림으로 끌어올린다. 순서는 저위험 고효율 우선.

## 확정 방향 (2026-07-11 사용자 확인)

- **GEO** = Generative Engine Optimization(AI 검색 인용 최적화). item 1은 표준 SEO(지역 페이지·구조화데이터·사이트맵)를 먼저 깔고 그 위에 GEO 레이어를 얹는다.
- **로그인 = 회원제 개인화의 관문** (2026-07-11 기획 변경): 카카오 로그인 회원만 **수영장 구독 → 구독 시설의 "일일 자유수영 알림"**(그날 자유수영 열리는 회차를 아침에 푸시) + 자유수영/요금 변동 알림을 받는다. 기존 익명 deviceId 아침요약 푸시는 계정 기반으로 승격. **비회원(익명)은 열람 + 제보만 가능**(구독·개인화 알림 불가). 백엔드 User 모델은 이 스코프에 맞춰 최소로.
- **순서** = 저위험 고효율 먼저(A~C 프론트 단독 완료 → D 로그인·회원제 → **E 맵-퍼스트 레이아웃 재배치** → F 스토어). ※E(맵-퍼스트)는 사실상 프론트 단독이라 D 없이도 착수 가능하나, 지도 UI가 구독 액션을 노출하므로 D 이후로 배치.
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

## Phase B: 디자인 리뉴얼 (iOS 레퍼런스) — 완료 (2026-07-11)

프론트 단독. 검증: typecheck/lint/test(29)/build(231p) 그린 + Playwright 라이트/다크 시각 확인(홈·상세·listing).

- **토큰 개편(globals.css)**: 색상을 `:root` 시맨틱 변수(라이트) → `prefers-color-scheme: dark` 오버라이드로 이관하고 `@theme`가 `var()`로 참조 → **다크모드 자동 전환**. `[data-theme]` 훅으로 수동 토글도 무비용 지원(테스트도 이 훅으로 다크 강제).
- iOS풍 상향: 라운드(button 8→12, input 12→14, sheet 14→22), **elevation 토큰**(`shadow-card`/`nav`/`sheet`, 다크 대응) — 중복 shadow 리터럴 ~15곳 토큰화. `.glass`(반투명 blur) 탭바/헤더용.
- **safe-area**: body `padding-top: env(safe-area-inset-top)` + 탭바/시트 하단 inset, viewport `viewportFit: 'cover'`, themeColor 라이트/다크 분기.
- 컴포넌트 일괄: Button(primary-fill·active scale/brightness), Chip, PoolCard, TabBar(glass), 바텀시트 2종(slide-up 애니 + shadow-sheet + safe-area). `bg-[#..]`·`text-red-500` 잔여 토큰화(fill-secondary/disabled/error).
- 대비 안전화: solid 채움은 `primary-fill`(양 테마 white-safe), accent `primary`는 다크에서 밝은 teal로 flip. 상태 잉크도 다크 명도 조정.

## Phase C: UX & 인터랙션 고도화 — 완료 (2026-07-11)

프론트 단독. 검증 동일(그린).

- **스켈레톤 로딩**: `Skeleton`/`PoolCardSkeleton` + shimmer(globals.css) + `app/loading.tsx`·`app/pool/[id]/loading.tsx`(force-dynamic 로드 중 표시, 레이아웃 정렬).
- **라우트 전환**: `<main>` enter-up 애니(고정 요소 미포함 → containing-block 튐 없음) + `@view-transition { navigation: auto }`(지원 브라우저 점진 향상). ※template.tsx 래핑은 transform/opacity가 fixed(TabBar·시트) 앵커를 깨서 회피.
- **pull-to-refresh**: 홈 콘텐츠 래퍼(`PullToRefresh`, 고정 요소 없음)에서 상단 당김 → `router.refresh()`. non-passive touchmove + 저항/임계값 + 스피너 인디케이터.
- **빈 상태 개선**: listing 카드 중복 문구 제거(StatusBadge와 이중 표기 해소), 상세 "준비중"을 아이콘형 빈 상태(홈과 일관)로.
- 낙관적 UI: 제보/의견/토글은 기존에 즉시 반영(no-backend 성공 처리·localStorage) 유지.

---

> 프론트 단독 A~C + **E(맵-퍼스트) 구현 완료**(E는 사용자 요청으로 D보다 먼저 착수, 지도 렌더링 시각검증만 배포/실기기 대기). 남은 D는 백엔드+카카오 등록, F는 Play Console이 필요해 **사용자 액션 대기**.
>
> ※ Phase C의 pull-to-refresh는 홈이 지도-퍼스트로 바뀌며 리스트 홈과 함께 은퇴(`PullToRefresh` 삭제). 스켈레톤은 맵-퍼스트용으로 교체.

## Phase D: 카카오 로그인 · 회원제 개인화 — 예정 (프론트+백엔드)

**회원/비회원 경계**(2026-07-11 기획 확정):
- **비회원(익명 deviceId)**: 열람 + **제보만** 가능. 구독·개인화 알림 불가. 지금의 익명 이용 경험을 그대로 유지(로그인 강제 없음).
- **회원(카카오 로그인)**: 수영장 **구독** + 구독 시설 **일일 자유수영 알림**(그날 자유수영 회차를 아침 푸시) + 자유수영/요금 변동 알림. 익명 시절 구독/푸시는 로그인 시 계정으로 승계.

- 백엔드: User 모델(카카오 OAuth), 익명 push→계정 연결, `Subscription`(user↔pool), **일일 자유수영 알림 크론**(구독 시설별 그날 세션 계산 → 아침 발송), 자유수영/요금 변동 감지 크론.
- 프론트: 선택 로그인 플로우(익명 유지), 상세/카드의 **구독 버튼**(회원 전용, 비회원은 로그인 유도), 알림 설정 화면. 제보는 비회원 포함 전원 유지.
- ⚠️ 사용자 작업: 카카오 디벨로퍼스 앱 등록(REST 키·redirect URI·동의항목).

## Phase E: 맵-퍼스트 레이아웃 재배치 (Apple Maps 최신 UI 레퍼런스) — 구현 완료 (2026-07-11, 프론트 단독)

리스트-퍼스트 홈을 **내 위치 기반 지도-퍼스트**로 전면 재배치. 레퍼런스 = **최신 Apple 지도 UI**(플로팅 반투명 패널·큰 라운드·헤비 blur·헤어라인 보더·드롭섀도, 우상단 스택형 맵 컨트롤). Phase B의 `.glass` 토큰을 `.glass-panel`(헤비 blur+헤어라인 보더)로 확장.

**구현 요약**: `components/map/MapExplorer.tsx`(풀스크린 지도+geolocation+상태색 마커+MarkerClusterer+현위치 버튼+선택 미니카드) + `components/map/MapSheet.tsx`(3단 detent 드래그 바텀시트) + `lib/geo.ts`(haversine 거리). 홈(`app/page.tsx`)=MapExplorer로 교체, `/map`→홈 리다이렉트, sitemap/llms 정리, 구 `HomeClient`·`FilterChips`·`PullToRefresh`·`ViewToggle`·`MapView` 삭제, PoolCard는 `/pools` SEO 페이지용으로 존치.
**검증**: typecheck/lint/test(29)/build(232p) 그린. ⚠️ **지도 타일·마커·클러스터·geolocation·드래그 시트의 실제 렌더링은 미검증** — 로컬에 `NEXT_PUBLIC_KAKAO_MAP_KEY` 없어 지도가 폴백으로만 뜸. **배포(키 등록된 Vercel)·실기기에서 시각 검증 필요**.

- **홈 = 지도**: `/`를 지도로 전환(기존 `/map` 로직 흡수). 진입 시 **Geolocation 권한 → 내 위치 센터링**, 주변 시설을 상태색 마커(green=지금 가능 / amber=곧 / gray=종료·준비중)로. 권한 거부 시 지역(시도) 폴백 센터. 600+곳은 **마커 클러스터링** 필수.
- **플로팅 글라스모피즘 필터**: 지역(시도/시군구) + 날짜(요일/오늘) 필터를 지도 위 **플로팅 글라스 바/칩**(Apple 지도풍 좌상단 반투명 카드 or 상단 필로우)으로. 날짜 선택 시 "그날 기준" 상태로 마커 재계산.
- **리스트뷰 역할 축소** (2026-07-11 확정 = 보조 유지): iOS 지도식 **드래그 가능한 바텀시트 리스트**(주변·필터 결과를 거리+상태순)로 보조 편입. 기존 전용 리스트 홈은 이 시트로 흡수(완전 삭제 아님). `/pools/*` SEO 지역 페이지는 별개로 유지.
- 맵 컨트롤: 우상단 스택(내 위치 재센터·지도유형), 마커 탭 → 글라스 미니카드(상태·요금·거리·구독[회원]) → 상세.
- 정합성: 상태 계산은 기존 `getPoolNowStatus` 재사용, 거리정렬은 geolocation, 다크모드는 Phase B 토큰 그대로. 카카오맵 SDK는 이미 `MapView.tsx`에 통합됨(마커 오버레이·클러스터·현위치만 추가).
- 검증 기준: geolocation 허용/거부 양쪽, 클러스터 성능(600+), 라이트/다크, safe-area와 플로팅 UI 겹침 없는지.

## Phase F: 플레이스토어 (TWA) — 예정

`docs/twa-release.md` 골격 존재. Bubblewrap 빌드, 서명 SHA256→assetlinks, 스토어 등록물.
⚠️ 사용자 작업: Google Play Console 계정($25 1회), 서명키.
