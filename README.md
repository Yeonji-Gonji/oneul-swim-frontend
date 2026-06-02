# 오늘수영 (oneul-swim)

하남 자유수영 정보앱 MVP. 권역별 수영장의 **지금 자유수영 가능 여부 · 요금 · 위치**를 한눈에 보여준다.

- **스택**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Kakao Maps · PWA
- **데이터**: 정적 JSON (`data/pools.json`, `data/private-pools.json`)
- **패키지 매니저**: pnpm

## 개발

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

환경변수는 `.env.local` 에 둔다.

```bash
NEXT_PUBLIC_KAKAO_MAP_KEY=<카카오 JavaScript 키>
```

> 키가 없거나 도메인 미등록(401)이면 지도는 **권역 핀 버튼 폴백**으로 동작한다. 앱은 키 없이도 빌드·구동된다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `pnpm dev` | 개발 서버 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 빌드 결과 실행 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` 타입 검사 |

## CI/CD

- **CI** — `.github/workflows/ci.yml`. `main` 푸시 및 PR마다 **lint → typecheck → build** 게이트 실행.
- **CD** — Vercel GitHub 연동. `main` 푸시 시 프로덕션 자동 배포, PR마다 프리뷰 URL 생성.

### Vercel 최초 연동 (1회)

1. [vercel.com/new](https://vercel.com/new) → `MODAC0/oneul-swim` Import (프레임워크 Next.js 자동 감지, 빌드 설정 그대로).
2. **Environment Variables** 에 `NEXT_PUBLIC_KAKAO_MAP_KEY` 추가 (Production · Preview).
3. Deploy. 이후 푸시마다 자동 배포.

### 카카오 도메인 등록

[Kakao Developers](https://developers.kakao.com) → 내 애플리케이션 → 플랫폼 → Web 사이트 도메인에 배포 도메인(`https://<프로젝트>.vercel.app` 및 커스텀 도메인)을 추가해야 지도가 뜬다.

### GitHub Actions 시크릿 (선택)

CI 빌드에서도 지도 키를 쓰려면 리포지토리 **Settings → Secrets → Actions** 에 `NEXT_PUBLIC_KAKAO_MAP_KEY` 등록. 미등록이어도 빌드는 통과한다.
