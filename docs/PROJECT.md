# PROJECT: oneul-swim-frontend 현황판

> 갱신일: 2026-07-11 (프론트 리뉴얼 Phase A~C 완료)
> 히스토리·의사결정 정본: obsidian vault `projects/oneul-swim.md` (private)
> 로드맵: [plan-2026-07-frontend-renewal.md](./plan-2026-07-frontend-renewal.md) · [plan-2026-07-enhancement.md](./plan-2026-07-enhancement.md)

## 현재 상태

- 하남 공공 수영장 4곳의 자유수영 정보(지금 상태·시간표·요금)를 제공하는 PWA. Vercel 배포(main 자동), 백엔드 API 연동(제보·아침 요약 푸시·강습 접수소식).
- 폴백 원칙: API·Kakao 키 장애 시에도 정적 `data/pools.json`으로 항상 동작. 홈·지도·시설상세는 `GET /pools` 우선(force-dynamic) + 정적 폴백.
- 미니 어드민(`/admin`, noindex, Bearer 토큰): 제보 처리·데이터/요금 수정·신선도 알림·접수소식 발송.

## 진행 중

- 없음 (코드 P0~P4 완료. 아래는 사용자 액션 대기)

## 사용자 액션 대기 (코드 완료, 외부 설정만 남음)

- Vercel 환경변수: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`(기존), `NEXT_PUBLIC_GA_ID`(측정, 선택), `NEXT_PUBLIC_KAKAO_REST_KEY`(어드민 카카오 로그인) 등록 + 재배포
- 실기기(Android Chrome) 푸시 구독 → 다음날 08:00 아침 요약 수신 확인
- 백엔드 `ADMIN_TOKEN` 설정 후 어드민 로그인에 사용
- TWA 스토어 출시: 실서명 SHA256 → assetlinks 교체 → 등록 (docs/twa-release.md)

## 최근 완료

- 2026-07-11 프론트 리뉴얼 **Phase E: 맵-퍼스트 레이아웃 재배치**(Apple Maps 최신 UI 레퍼런스): 홈을 **내 위치 기반 지도-퍼스트**로 전면 재배치. `MapExplorer`(풀스크린 지도+geolocation+상태색 마커+MarkerClusterer+현위치+선택 미니카드) + `MapSheet`(3단 detent 드래그 바텀시트) + 플로팅 글라스(.glass-panel) **필터 3종(지역/날짜/상태)** + `lib/geo.ts`. 상태 필터 = 전체 / 지금 운영중 / **오픈 준비중(=운영중 아닌 전부)**. `/map`→홈 리다이렉트, 구 HomeClient·FilterChips·PullToRefresh·ViewToggle·MapView 삭제(PoolCard는 /pools SEO용 존치). **검증 완료(localhost:3000, Playwright)**: 지도·마커·클러스터·geolocation·거리정렬·3필터·시트 정상, 상태 카운트(604/5/599). 바텀시트-탭바 겹침 수정(시트 바닥 뷰포트 고정+콘텐츠 탭바높이 패딩). (D 로그인보다 먼저 착수 = 사용자 지시)
- 2026-07-11 프론트 리뉴얼 Phase B(디자인)·C(UX): iOS풍 토큰 개편 + **다크모드**(prefers-color-scheme, `[data-theme]` 토글 훅) + elevation/shadow 토큰 + safe-area(env inset·viewportFit cover) / 컴포넌트 일괄 리스타일(버튼·칩·카드·글래스 탭바·바텀시트) / 스켈레톤 로딩(loading.tsx)·`<main>` 라우트 전환 애니·pull-to-refresh(router.refresh)·listing 빈 상태 개선. 검증 그린(typecheck/lint/test29/build231) + 라이트·다크 시각 확인. 상세 로드맵 [plan-2026-07-frontend-renewal.md](./plan-2026-07-frontend-renewal.md). ⚠️ 커밋·푸시는 사용자 몫.
- 2026-07-11 어드민 시간표 초안 검수 UI + 카카오 로그인: `/admin`에 "시간표 초안" 탭(승인/반려·근거 스니펫 표시), 카카오 로그인 게이트(본인 계정만 백엔드가 `ADMIN_TOKEN` 발급 → 기존 Bearer 인증 재사용). 기존 토큰 입력은 비상용 폴백으로 유지.
- 2026-07-11 P4: `SOON_THRESHOLD_MIN` 임계값 실제 로직에 적용 (데드코드 정리)
- 2026-07-11 P4: 디자인 토큰 이중 관리 해소 (`globals.css` @theme 단일 소스로 통합)

- 2026-07-09 P1 Vitest 도입: lib/pools 상태·주차 규칙 단위테스트 22개 + CI test 스텝
- 2026-07-09 P3 프론트: `GET /pools` API 우선 로딩(lib/pools-data.ts) + 정적 폴백, 미니 어드민(`/admin`), 제보 루프 완성(APPLIED 강조·처리시각)
- 2026-07-09 P4: GA4 측정(env 게이트, report_submit·push_subscribe), 강습 "접수 소식 알림" 서버구독 재정의, TWA 출시 절차 문서화
- 2026-07-09 P0: TabBar 낡은 주석 정정
- 2026-07-05 비기능 요소 전면 실기능화 / 제보 전송 백엔드 연동

## 알려진 이슈 / 남은 일

- 좌표·주소 null 이슈는 해소됨(4곳 전부 lat/lng/address 존재)
- 리뉴얼 진행(로드맵 참조): 프론트 단독 **A~C + E(맵-퍼스트) 구현 완료**. 남은 **D 카카오 로그인·회원제**(비회원=열람+제보만 / 회원=구독+일일 자유수영 알림)·**F TWA 스토어**는 백엔드/외부 등록 필요 → 사용자 액션 대기.
- Phase E 지도 렌더링은 localhost:3000(prod build)에서 Playwright로 검증 완료. ⚠️ Kakao JS 키는 **도메인 등록 필수**(:3000 동작, 미등록 도메인은 401 폴백) → **Vercel 배포 도메인이 카카오 콘솔 Web 플랫폼에 등록**돼 있는지 확인.
- ✅ `/more` 하이드레이션 에러(React #418) 수정: 렌더 중 `isPushSupported()`(SSR false/CSR true) → `useSyncExternalStore` hydration 게이트로 클라이언트에서만 평가. Playwright 콘솔 0 errors 확인.
- (선택) 다크모드 수동 토글 UI: 토큰·`[data-theme]` 훅은 준비됨. 현재는 시스템 설정 자동 추종. 노플래시 스크립트+토글 추가 시 `/more`에 배치 예정.

## 링크

- 백엔드: `../oneul-swim-backend` (API `https://oneul-swim.duckdns.org`)
- GitHub: Yeonji-Gonji/oneul-swim-frontend
