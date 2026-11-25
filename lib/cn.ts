/** 의존성 없는 className 합성 유틸 (clsx/tailwind-merge 도입 전 임시) */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
