import { Link } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'

import { formatAmount, truncateAddress } from '@/lib/format'
import { TOKEN_DECIMALS } from '@/hooks/balance/use-token-balance'
import { useMyToPay, type ToPayItem } from '@/hooks/graphql/use-my-to-pay'

import { urgencyChipClass, urgencyLabel } from './urgency'

/**
 * Activity-page section that lists every obligation where the user is a payer.
 * Renders nothing when the list is empty (activity page already shows Recent
 * Activity below, which is the sensible fallback).
 */
export function ToPaySection() {
  const { items, count, overdueCount, isLoading } = useMyToPay()
  if (isLoading) return null
  if (count === 0) return null

  return (
    <section className="mb-6">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-[#B9603A]" />
          <h2 className="display-title text-lg font-bold text-[var(--sea-ink)]">
            Bills to pay
          </h2>
        </div>
        <span className="text-xs font-semibold text-[var(--sea-ink-soft)]">
          {overdueCount > 0
            ? `${overdueCount} overdue`
            : `${count} pending`}
        </span>
      </header>
      <div className="grid gap-3">
        {items.map((it) => (
          <ToPayRow key={it.vault} item={it} />
        ))}
      </div>
    </section>
  )
}

function ToPayRow({ item }: { item: ToPayItem }) {
  const borderClass =
    item.urgency === 'overdue'
      ? 'border-[#D9564A]'
      : item.urgency === 'dueSoon'
        ? 'border-[#E08043]'
        : 'border-[var(--line)]'

  return (
    <Link
      to="/pay/$vault"
      params={{ vault: item.vault }}
      className={`flex items-center gap-3 rounded-2xl border ${borderClass} bg-white p-3 no-underline text-inherit transition-colors hover:bg-[rgba(56,161,145,0.05)]`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          item.urgency === 'overdue'
            ? 'bg-[#F8DDD4] text-[#A4463A]'
            : item.urgency === 'dueSoon'
              ? 'bg-[#FDE8CC] text-[#B9603A]'
              : 'bg-[rgba(56,161,145,0.18)] text-[var(--lagoon-deep)]'
        }`}
      >
        <AlertTriangle size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-sm font-semibold text-[var(--sea-ink)]">
          {truncateAddress(item.creator)} wants{' '}
          {formatAmount(item.amountDue, TOKEN_DECIMALS[item.tokenSymbol] ?? 18)}{' '}
          {item.tokenSymbol}
        </p>
        <p className="mt-1 m-0 text-xs text-[var(--sea-ink-soft)]">
          <span
            className={`mr-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${urgencyChipClass(item.urgency)}`}
          >
            {urgencyLabel(item)}
          </span>
          Vault {truncateAddress(item.vault)}
        </p>
      </div>
      <span className="btn-primary shrink-0 px-3 py-1.5 text-xs">Pay</span>
    </Link>
  )
}
