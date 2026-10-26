import { redirect } from 'next/navigation';

/**
 * 루트 catch-all — 정의된 어떤 라우트에도 매칭되지 않는 경로를 홈으로 보낸다.
 * (app/pool/[id] 등 구체 라우트가 우선하므로 정상 경로는 영향 없음)
 * 루트 loading.tsx 가 있어 응답이 스트리밍으로 먼저 나가므로 HTTP 307 이 아니라
 * 200 + `<meta http-equiv="refresh" content="1;url=/">` 로 이동한다(2026-10-26 실측).
 */
export default function CatchAll() {
  redirect('/');
}
