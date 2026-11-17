---
project: oneul-swim-frontend
type: project-overview
---

# PROJECT: oneul-swim-frontend

> 이 문서는 프로젝트 목표와 기술 스택만 담음. 진행 상황(진행 중·완료·남은 일·결정 대기)은 적지 않음.
> - **진행 상황·남은 일**: [GitHub Issues](https://github.com/Yeonji-Gonji/oneul-swim-frontend/issues)
> - **변경 이력**: `git log`·PR
> - **명령·환경변수·구조·운영 함정**: 루트 [README](../README.md)

## 목표

전국 공공 수영장(약 600곳)의 자유수영 정보(지금 가능 여부·시간표·요금·위치)를 내 위치 기반 지도로 보여 주는 PWA. 제보·아침 요약 푸시·강습 접수 소식 알림은 백엔드 API와 연동하고, API·지도 키가 없어도 정적 데이터로 동작함.

- **하지 않는 것**: 회원제, 안드로이드 스토어(TWA) 출시. 2026-10-26 폐기(절차 문서는 `archive/twa-release.md`)

## 기술 스택

| 구성 | 스택 | 배포 | 안내 |
| --- | --- | --- | --- |
| 웹앱(이 리포) | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Kakao Maps SDK · Web Push · PWA(manifest·sw.js) · pnpm | Vercel `https://oneul-swim.vercel.app`, main push 자동 배포 | [README](../README.md) |
| 테스트 | vitest(단위) · Playwright(배포 후 운영 URL 스모크) | GitHub Actions `ci.yml`·`smoke.yml` | [README](../README.md) "CI/CD" |
| 백엔드 API | 별도 리포 [oneul-swim-backend](https://github.com/Yeonji-Gonji/oneul-swim-backend) | `NEXT_PUBLIC_API_URL` = `https://oneul-swim.duckdns.org` | 백엔드 `docs/OPERATIONS.md` |
| 정적 폴백 데이터 | `data/pools.json` | 번들에 포함 | `lib/pools-data.ts` |

## 참고 문서

- **구 의사결정 기록**: [`docs/adr/`](adr/)(2026-07 의 ADR-001~009 원문은 유실. 코드에 근거가 남은 2건만 ADR-0001·0002 로 복원, 경위는 `adr/README.md`)
- **지난 계획·현황판**: [`docs/archive/`](archive/)(2026-07 로드맵 `plan-2026-07-*.md`, 2026-07-31 현황판 `status-2026-07-31.md`. 작성 시점 값으로 고정)
