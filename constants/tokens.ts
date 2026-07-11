/**
 * 앱 핵심 상태 규약
 * UI 컴포넌트(StatusBadge 등)가 CSS 변수 매핑 시 참조할 수 있도록 매핑 로직만 남깁니다.
 *
 * ⚠️ 디자인 토큰(색상, 타이포, elevation 등)은 Tailwind v4 globals.css 가 Single Source of Truth입니다.
 * 색상은 :root 시맨틱 변수(라이트) → prefers-color-scheme: dark 오버라이드로 라이트/다크가 자동 전환되며,
 * @theme 는 그 변수를 var()로 참조합니다. Foundations(Figma) 변경 시 globals.css 와 함께 갱신하세요.
 */

import type { NowStatus } from '../lib/pools';

export const statusToToken = (
  kind: NowStatus['kind'],
): string => {
  switch (kind) {
    case 'open':
      return 'nowOpen';
    case 'soon':
      return 'upcoming';
    case 'closed-today':
    case 'none-today':
    case 'listing':
      return 'closed';
    default:
      return 'closed';
  }
};
