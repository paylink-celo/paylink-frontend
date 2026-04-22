import { Link, useRouterState } from '@tanstack/react-router'
import {
  ChartBarIcon,
  DocumentPlusIcon,
  HomeIcon,
  InboxIcon,
} from '@heroicons/react/24/outline'
import {
  ChartBarIcon as ChartBarIconSolid,
  DocumentPlusIcon as DocumentPlusIconSolid,
  HomeIcon as HomeIconSolid,
  InboxIcon as InboxIconSolid,
} from '@heroicons/react/24/solid'
import type { ComponentType, SVGProps } from 'react'

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>

const navItems: Array<{
  label: string
  to: string
  Icon: NavIcon
  IconActive: NavIcon
}> = [
  { label: 'Home', to: '/', Icon: HomeIcon, IconActive: HomeIconSolid },
  { label: 'Create', to: '/create', Icon: DocumentPlusIcon, IconActive: DocumentPlusIconSolid },
  { label: 'Activity', to: '/activity', Icon: ChartBarIcon, IconActive: ChartBarIconSolid },
  { label: 'Requests', to: '/requests', Icon: InboxIcon, IconActive: InboxIconSolid },
]

export function BottomNavbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[var(--header-bg)] backdrop-blur-md border-t border-[var(--line)] z-50">
      <div className="flex items-stretch justify-around h-16 px-2">
        {navItems.map(({ label, to, Icon, IconActive }) => {
          const isActive =
            to === '/'
              ? pathname === '/'
              : pathname === to || pathname.startsWith(`${to}/`)

          const ActiveOrIdle = isActive ? IconActive : Icon

          return (
            <Link
              key={to}
              to={to}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 mx-1 my-2 rounded-2xl py-1.5 transition-colors ${
                isActive
                  ? 'nav-item--active bg-[var(--lagoon-soft)]/55 text-[var(--lagoon-deep)]'
                  : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
              }`}
            >
              <ActiveOrIdle className="size-[22px]" />
              <span
                className={`text-xs ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Safe area spacer for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
