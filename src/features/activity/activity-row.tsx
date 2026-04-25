import { Link } from '@tanstack/react-router'
import { FileText, Hourglass, Receipt } from 'lucide-react'
import { formatAmount, truncateAddress } from '@/lib/format'
import type { ActivityItem, Tone } from './types'

export function ActivityRow({ item }: { item: ActivityItem }) {
  const sign = item.direction === 'in' ? '+' : '-'
  const amountColor =
    item.tone === 'warning'
      ? 'text-[#B9603A]'
      : item.direction === 'in'
        ? 'text-[var(--lagoon-deep)]'
        : 'text-[var(--sea-ink)]'

  return (
    <Link
      to="/pay/$vault"
      params={{ vault: item.vault }}
      className="activity-row press-scale no-underline text-inherit"
    >
      <ActivityIcon kind={item.icon} tone={item.tone} />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-sm font-semibold leading-snug text-[var(--sea-ink)] line-clamp-2">
          {item.title}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--sea-ink-soft)]">
          <Receipt size={12} aria-hidden />
          {truncateAddress(item.counterparty)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className={`m-0 text-sm font-bold leading-tight ${amountColor}`}>
          {sign}
          {formatAmount(item.amount)}
        </p>
        <p className="m-0 text-xs text-[var(--sea-ink-soft)]">cUSD</p>
        <span className={`activity-badge activity-badge--${item.tone}`}>{item.statusLabel}</span>
      </div>
    </Link>
  )
}

function ActivityIcon({ kind, tone }: { kind: ActivityItem['icon']; tone: Tone }) {
  const toneClass =
    tone === 'success'
      ? 'bg-[rgba(56,161,145,0.18)] text-[var(--lagoon-deep)]'
      : tone === 'warning'
        ? 'bg-[#F6DCCB] text-[#B9603A]'
        : 'bg-[#E6E6E6] text-[var(--sea-ink-soft)]'

  const IconCmp = kind === 'invoice' ? FileText : kind === 'receipt' ? Receipt : Hourglass

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${toneClass}`}
    >
      <IconCmp size={18} />
    </div>
  )
}
