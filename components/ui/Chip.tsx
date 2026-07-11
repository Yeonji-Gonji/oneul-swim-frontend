import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Figma Components/FilterChip — selected / default. 필터·제보사유 등 공용 */
export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 select-none whitespace-nowrap rounded-full px-4 py-2 text-sm transition duration-150 active:scale-[0.96]',
        selected
          ? 'bg-primary-fill font-bold text-white'
          : 'border border-line bg-surface font-normal text-text-mute',
      )}
    >
      {children}
    </button>
  );
}
