import Link from 'next/link';
import { IconHome, IconBell, IconGrid } from '@/components/ui/icons';
import { cn } from '@/lib/cn';

/**
 * 하단 탭바 — 홈 / 강습알림 / 더보기.
 * 세 탭 모두 실제 라우트로 연결된다(/, /lessons, /more). active prop으로 현재 탭 강조.
 */
const TABS = [
  { key: 'home', label: '홈', Icon: IconHome, href: '/' },
  { key: 'lessons', label: '강습알림', Icon: IconBell, href: '/lessons' },
  { key: 'more', label: '더보기', Icon: IconGrid, href: '/more' },
] as const;

export function TabBar({ active = 'home' }: { active?: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10">
      <div className="glass mx-auto flex w-full max-w-md items-center justify-between rounded-t-sheet border-t border-line px-10 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-nav">
        {TABS.map(({ key, label, Icon, href }) => {
          const isActive = key === active;
          const inner = (
            <span
              className={cn(
                'flex flex-col items-center gap-1',
                isActive ? 'text-primary' : 'text-closed',
              )}
            >
              <Icon className="size-5" />
              <span
                className={cn(
                  'text-micro',
                  isActive ? 'font-bold' : 'font-normal',
                )}
              >
                {label}
              </span>
            </span>
          );
          return href ? (
            <Link key={key} href={href}>
              {inner}
            </Link>
          ) : (
            <span key={key} aria-disabled className="cursor-default">
              {inner}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
