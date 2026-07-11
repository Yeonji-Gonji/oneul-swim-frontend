import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/constants/site';
import { getPoolsList } from '@/lib/pools-data';
import { listSidos } from '@/lib/regions';

// llms.txt 는 지역 목록만 반영하면 되므로 ISR(1시간).
export const revalidate = 3600;

/**
 * /llms.txt — LLM·AI 검색이 서비스를 정확히 이해하도록 돕는 요약(마크다운, text/plain).
 * llms.txt 관례: 한 줄 소개 → 핵심 사실 → 주요 페이지 링크(절대 URL).
 */
export async function GET() {
  const pools = await getPoolsList();
  const sidos = listSidos(pools);
  const total = sidos.reduce((sum, s) => sum + s.count, 0);

  // 시설 수 상위 시도 몇 곳을 대표 링크로 노출
  const topSidoLinks = sidos
    .slice(0, 8)
    .map(
      ({ sido, count }) =>
        `- [${sido} 자유수영장](${SITE_URL}/pools/${encodeURIComponent(sido)}) (${count}곳)`,
    )
    .join('\n');

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## 핵심 사실

- 전국 공공 수영장의 자유수영(일반 개방) 시간표와 요금을 지역별로 제공합니다.
- 지금 이 시간 자유수영이 가능한지(운영 중 / 곧 시작 / 오늘 종료)를 실시간으로 알려줍니다.
- 데이터 출처: 국민체육진흥공단(KSPO) 공공데이터로 전국 수영장 목록을 임포트하고, 자유수영 시간표·요금은 시설 공지와 이용자 제보(크라우드소싱)로 채웁니다.
- 현재 등록 시설 ${total}곳. 각 시설 상세에 마지막 업데이트 날짜를 표기해 신선도를 관리합니다.

## 주요 페이지

- [지역별 자유수영장 인덱스](${SITE_URL}/pools)
${topSidoLinks}
- [강습 접수 소식 알림](${SITE_URL}/lessons)
- [지도로 보기](${SITE_URL}/map)
`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
