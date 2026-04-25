import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount, truncateAddress } from '@/lib/format'
import { TOKEN_DECIMALS } from '@/hooks/balance/use-token-balance'
import { useMyToPay, type ToPayItem } from '@/hooks/graphql/use-my-to-pay'

import { urgencyChipClass, urgencyLabel } from './urgency'

// Resolve decimals from the token symbol attached to a ToPayItem. The hook
// itself keeps the mapping aligned with the canonical `TOKEN_DECIMALS`.
function decimalsForSymbol(symbol: string): number {
  return TOKEN_DECIMALS[symbol] ?? 18
}

const SHOW_ON_HOME = 3

/**
 * Hero card that surfaces unpaid obligations near the top of the home page.
 * Collapses to an empty-state ("All clear") once the wallet has nothing due.
 */
export function ToPayCard() {
  const { items, count, overdueCount, totalsByToken, isLoading } = useMyToPay()

  if (isLoading) {
    return (
      <section className="island-shell mb-6 rounded-2xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div>
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="mt-1.5 h-4 w-32 rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </section>
    )
  }

  if (count === 0) {
    return (
      <section className="island-shell mb-6 flex items-center gap-3 rounded-2xl p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(56,161,145,0.18)] text-[var(--lagoon-deep)]">
          <CheckCircle2 size={18} />
        </div>
        <div>
          <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">All clear</p>
          <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
            No bills waiting for you right now.
          </p>
        </div>
      </section>
    )
  }

  const shown = items.slice(0, SHOW_ON_HOME)
  const headline =
    overdueCount > 0
      ? `${overdueCount} overdue · ${count - overdueCount} upcoming`
      : `${count} bill${count === 1 ? '' : 's'} to pay`

  return (
    <section className="island-shell mb-6 rounded-2xl p-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              overdueCount > 0 ? 'bg-[#F8DDD4] text-[#A4463A]' : 'bg-[#FDE8CC] text-[#B9603A]'
            }`}
          >
            <AlertTriangle size={16} />
          </div>
          <div>
            <p className="island-kicker m-0">Your bills</p>
            <h3 className="m-0 text-base font-semibold text-[var(--sea-ink)]">{headline}</h3>
          </div>
        </div>
        <div className="flex flex-col items-end text-xs text-[var(--sea-ink-soft)]">
          {totalsByToken.map((t) => (
            <span key={t.symbol} className="whitespace-nowrap">
              <b className="text-[var(--sea-ink)]">
                {formatAmount(t.amount, decimalsForSymbol(t.symbol))}
              </b>{' '}
              {t.symbol}
            </span>
          ))}
        </div>
      </header>

      <ul className="m-0 flex flex-col gap-2 p-0 list-none">
        {shown.map((it) => (
          <li key={it.vault}>
            <Row item={it} />
          </li>
        ))}
      </ul>

      {count > SHOW_ON_HOME && (
        <Link
          to="/activity"
          className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-[var(--lagoon-deep)]"
        >
          View all {count} bills <ArrowRight size={14} />
        </Link>
      )}
    </section>
  )
}

function Row({ item }: { item: ToPayItem }) {
  return (
    <Link
      to="/pay/$vault"
      params={{ vault: item.vault }}
      className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2.5 no-underline text-inherit transition-colors hover:bg-white"
    >
      <div className="min-w-0">
        <p className="m-0 truncate text-sm font-semibold text-[var(--sea-ink)]">
          From {truncateAddress(item.creator)}
        </p>
        <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${urgencyChipClass(item.urgency)}`}
          >
            {urgencyLabel(item)}
          </span>
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="m-0 text-sm font-bold text-[var(--sea-ink)]">
          {formatAmount(item.amountDue, decimalsForSymbol(item.tokenSymbol))}
        </p>
        <p className="m-0 text-[10px] font-semibold text-[var(--sea-ink-soft)]">
          {item.tokenSymbol}
        </p>
      </div>
    </Link>
  )
}
