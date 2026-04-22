import { Link, useMatchRoute } from '@tanstack/react-router'
import { Home, FilePlus, Activity, Inbox } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const navItems: Array<{ label: string; to: string; Icon: LucideIcon }> = [
  { label: 'Home', to: '/', Icon: Home },
  { label: 'Create', to: '/create', Icon: FilePlus },
  { label: 'Activity', to: '/activity', Icon: Activity },
  { label: 'Requests', to: '/requests', Icon: Inbox },
]

export function BottomNavbar() {
  const matchRoute = useMatchRoute()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[var(--header-bg)] backdrop-blur-md border-t border-[var(--line)] z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ label, to, Icon }) => {
          const isActive = to === '/'
            ? !!matchRoute({ to, fuzzy: false })
            : !!matchRoute({ to })

          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors ${
                isActive
                  ? 'text-[var(--lagoon-deep)]'
                  : 'text-[var(--sea-ink-soft)]'
              }`}
            >
              <Icon size={22} />
      <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>

      {/* Safe area spacer for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
