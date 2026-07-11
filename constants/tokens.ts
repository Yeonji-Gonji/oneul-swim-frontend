/**
 * 앱 핵심 상태 규약
 * UI 컴포넌트(StatusBadge 등)가 CSS 변수 매핑 시 참조할 수 있도록 매핑 로직만 남깁니다.
 *
 * ⚠️ 디자인 토큰(색상, 타이포 등)은 Tailwind v4 globals.css `@theme` 블록이 Single Source of Truth입니다.
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
