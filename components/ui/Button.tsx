import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Figma Components/Button — solid / outline / medium + disabled */
export type ButtonVariant = 'solid' | 'outline' | 'medium';

const BASE =
  'flex w-full select-none items-center justify-center gap-1.5 rounded-button px-4 py-4.5 text-base font-bold transition duration-150 active:scale-[0.98]';

const VARIANT: Record<ButtonVariant, string> = {
  solid: 'bg-primary-fill text-white active:brightness-95',
  outline: 'border border-primary text-primary active:bg-primary-5',
  medium: 'bg-fill-secondary text-text active:brightness-95',
};

/** 버튼 클래스 — <a>/<Link> 등 비-button 요소에도 동일 스타일 적용용 */
export function buttonClass(
  variant: ButtonVariant = 'solid',
  opts?: { disabled?: boolean },
): string {
  if (opts?.disabled)
    return cn(
      BASE,
      'cursor-not-allowed bg-fill-disabled text-white active:scale-100',
    );
  return cn(BASE, VARIANT[variant]);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = 'solid',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(buttonClass(variant, { disabled }), className)}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
