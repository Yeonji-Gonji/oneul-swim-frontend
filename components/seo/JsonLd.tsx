/**
 * JSON-LD 주입 공용 컴포넌트.
 * - undefined/null 필드는 직렬화에서 제거(구조화 데이터에 빈 값 금지).
 * - "<" 를 이스케이프해 </script> 삽입 등 XSS 를 차단한다.
 */

/** 객체에서 undefined·null 값을 재귀적으로 제거 */
function prune<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(prune) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined || v === null) continue;
      out[k] = prune(v);
    }
    return out as T;
  }
  return value;
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(prune(data)).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // 구조화 데이터 주입: 위에서 < 이스케이프로 안전 처리됨
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
