'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function HomeIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" fill={filled ? 'currentColor' : 'none'} />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" strokeWidth="1.6" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

function ChefHatIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13.87A4 4 0 017.41 6a5.11 5.11 0 019.18 0 4 4 0 011.41 7.87V20H6z" fill={filled ? 'currentColor' : 'none'} />
      <line x1="6" y1="17" x2="18" y2="17" />
    </svg>
  )
}

function BoardIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" fill={filled ? 'currentColor' : 'none'} />
      <rect x="14" y="3" width="7" height="7" rx="1" fill={filled ? 'currentColor' : 'none'} />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function ProfileIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" fill={filled ? 'currentColor' : 'none'} />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

const TABS = [
  {
    label: 'Home',
    href: '/household',
    Icon: ({ active }: { active: boolean }) => <HomeIcon filled={active} />,
  },
  {
    label: 'Track',
    href: '/log',
    Icon: () => <PlusIcon />,
  },
  {
    label: 'Meals',
    href: '/meals',
    Icon: ({ active }: { active: boolean }) => <ChefHatIcon filled={active} />,
  },
  {
    label: 'Board',
    href: '/board',
    Icon: ({ active }: { active: boolean }) => <BoardIcon filled={active} />,
  },
  {
    label: 'Profile',
    href: '/profile',
    Icon: ({ active }: { active: boolean }) => <ProfileIcon filled={active} />,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around h-14 px-1">
        {TABS.map(({ label, href, Icon }) => {
          const active = pathname === href || (label === 'Home' && pathname === '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 min-w-[52px] rounded-xl transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon active={active} />
              <span
                className={`text-[9px] font-semibold uppercase tracking-wide ${
                  active ? 'text-indigo-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
