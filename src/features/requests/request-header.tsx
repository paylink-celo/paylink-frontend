import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

import { formatAmount } from '@/lib/format'

import type { Direction } from './types'

export function RequestHeader({
  direction,
  name,
  subtitle,
  amount,
  avatarTone,
}: {
  direction: Direction
  name: string
  subtitle: string
  amount: bigint
  avatarTone: string
}) {
  const label = direction === 'incoming' ? 'INCOMING' : 'OUTGOING'
  const labelColor = direction === 'incoming' ? 'text-[#B9603A]' : 'text-[var(--lagoon-deep)]'
  const Arrow = direction === 'incoming' ? ArrowDownLeft : ArrowUpRight
  const initial = name.charAt(0).toUpperCase() || 'U'
  const truncatedSubtitle = subtitle.length > 10 ? `${subtitle.slice(0, 10)}...` : subtitle

  return (
    <div className="flex items-start gap-3">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
        style={{ background: avatarTone }}
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`m-0 flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${labelColor}`}
        >
          <Arrow size={14} />
          {label}
        </p>
        <p className="mt-1 m-0 text-base font-bold text-(--sea-ink)">{name}</p>
        <p className="mt-0.5 m-0 text-sm text-(--sea-ink-soft) line-clamp-1">
          {truncatedSubtitle}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="m-0 text-xl font-extrabold text-(--sea-ink) leading-none">
          ${formatAmount(amount)}
        </p>
      </div>
    </div>
  )
}
