# PROJECT: oneul-swim-frontend 현황판

> 갱신일: 2026-07-09 (P0~P4 코드 구현 완료)
> 히스토리·의사결정 정본: obsidian vault `projects/oneul-swim.md` (private)
> 로드맵: [plan-2026-07-enhancement.md](./plan-2026-07-enhancement.md)

## 현재 상태

- 하남 공공 수영장 4곳의 자유수영 정보(지금 상태·시간표·요금)를 제공하는 PWA. Vercel 배포(main 자동), 백엔드 API 연동(제보·아침 요약 푸시·강습 접수소식).
- 폴백 원칙: API·Kakao 키 장애 시에도 정적 `data/pools.json`으로 항상 동작. 홈·지도·시설상세는 `GET /pools` 우선(force-dynamic) + 정적 폴백.
- 미니 어드민(`/admin`, noindex, Bearer 토큰): 제보 처리·데이터/요금 수정·신선도 알림·접수소식 발송.

## 진행 중

- 없음 (코드 P0~P4 완료. 아래는 사용자 액션 대기)

## 사용자 액션 대기 (코드 완료, 외부 설정만 남음)

- Vercel 환경변수: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`(기존), `NEXT_PUBLIC_GA_ID`(측정, 선택) 등록 + 재배포
- 실기기(Android Chrome) 푸시 구독 → 다음날 08:00 아침 요약 수신 확인
- 백엔드 `ADMIN_TOKEN` 설정 후 어드민 로그인에 사용
- TWA 스토어 출시: 실서명 SHA256 → assetlinks 교체 → 등록 (docs/twa-release.md)

## 최근 완료

- 2026-07-09 P1 Vitest 도입: lib/pools 상태·주차 규칙 단위테스트 22개 + CI test 스텝
- 2026-07-09 P3 프론트: `GET /pools` API 우선 로딩(lib/pools-data.ts) + 정적 폴백, 미니 어드민(`/admin`), 제보 루프 완성(APPLIED 강조·처리시각)
- 2026-07-09 P4: GA4 측정(env 게이트, report_submit·push_subscribe), 강습 "접수 소식 알림" 서버구독 재정의, TWA 출시 절차 문서화
- 2026-07-09 P0: TabBar 낡은 주석 정정
- 2026-07-05 비기능 요소 전면 실기능화 / 제보 전송 백엔드 연동

## 알려진 이슈 / 남은 일

- `lib/pools.ts`의 `SOON_THRESHOLD_MIN` 상수가 미사용 데드코드. soon 판정이 임계값 없이 동작(90분 임박 강조 미반영), 의도 확인 후 정리 필요
- 디자인 토큰이 constants/tokens.ts와 globals.css @theme 이중 관리
- 좌표·주소 null 이슈는 해소됨(4곳 전부 lat/lng/address 존재)

## 링크

- 백엔드: `../oneul-swim-backend` (API `https://161-33-15-188.sslip.io`)
- GitHub: Yeonji-Gonji/oneul-swim-frontend
