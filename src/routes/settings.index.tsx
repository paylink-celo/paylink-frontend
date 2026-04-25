import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BarChart3, BookOpen, ChevronRight } from 'lucide-react'

import { PageHeader } from '@/components/page-header'

export const Route = createFileRoute('/settings/')({ component: SettingsPage })

const menuItems = [
  {
    key: 'analytics',
    icon: <BarChart3 size={20} />,
    title: 'Analytics',
    desc: 'Income, outcome, and invoice breakdown',
    to: '/settings/analytics',
  },
  {
    key: 'howto',
    icon: <BookOpen size={20} />,
    title: 'How to Use',
    desc: 'Step-by-step guide to using PayMe',
    to: '/settings/how-to-use',
  },
] as const

function SettingsPage() {
  const navigate = useNavigate()

  return (
    <div className="page-enter page-wrap pb-24 pt-3">
      <PageHeader title="Settings" />

      <div className="grid gap-3">
        {menuItems.map((item, i) => (
          <button
            key={item.key}
            type="button"
            onClick={() => navigate({ to: item.to })}
            className="island-shell rounded-2xl p-4 flex items-center gap-3 text-left press-scale stagger-item"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(56,161,145,0.18)] text-[var(--lagoon-deep)]">
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="m-0 text-sm font-semibold text-[var(--sea-ink)]">{item.title}</h3>
              <p className="m-0 text-xs text-[var(--sea-ink-soft)]">{item.desc}</p>
            </div>
            <ChevronRight size={18} className="text-[var(--sea-ink-soft)]" />
          </button>
        ))}
      </div>
    </div>
  )
}
