# PROJECT: oneul-swim-frontend 현황판

> 갱신일: 2026-07-09
> 히스토리·의사결정 정본: obsidian vault `projects/oneul-swim.md` (private)
> 로드맵: [plan-2026-07-enhancement.md](./plan-2026-07-enhancement.md)

## 현재 상태

- 하남 공공 수영장 4곳의 자유수영 정보(지금 상태·시간표·요금)를 제공하는 PWA. Vercel 배포(main 자동), 백엔드 API 연동(제보·아침 요약 푸시).
- 폴백 원칙: API·Kakao 키 장애 시에도 정적 `data/pools.json`으로 항상 동작.

## 진행 중

- P0: Vercel 환경변수(`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`) 등록 + 실기기 푸시 검증 (사용자 액션)

## 최근 완료

- 2026-07-09 고도화 기획 P0~P4 수립 (plan-2026-07-enhancement.md)
- 2026-07-05 비기능 요소 전면 실기능화: /reports·/data-policy·FeedbackSheet 신설, 푸시 구독 토글, sw.js push 핸들러
- 2026-07-05 제보 전송 백엔드 연동 (lib/report-api.ts, 장애 시 기존 UX 폴백)

## 알려진 이슈 / 남은 일

- 프론트 테스트 0개 (P1에서 Vitest 도입 예정: lib/pools.ts 상태 계산·주차 규칙)
- 일부 시설 좌표·주소 null (P1 지오코딩 보강 예정)
- 강습 알림 토글은 localStorage 저장뿐, 실제 발송 없음 (P4에서 "접수 소식 알림"으로 재정의 예정)
- TWA assetlinks.json SHA256 플레이스홀더 (P4)
- 디자인 토큰이 constants/tokens.ts와 globals.css @theme 이중 관리

## 링크

- 백엔드: `../oneul-swim-backend` (API `https://161-33-15-188.sslip.io`)
- GitHub: Yeonji-Gonji/oneul-swim-frontend
