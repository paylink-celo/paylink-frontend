import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Wallet } from 'lucide-react'

import { formatAmount, truncateAddress } from '@/lib/format'
import { useInvoices } from './use-invoices'
import type { Invoice } from './types'

/**
 * Invoices where the current user is the creator and payment has been
 * received (status PARTIAL=1 or FUNDED=2) — funds are sitting in the
 * vault waiting to be released.
 */
function useReleasable() {
  const { invoices, loading } = useInvoices()

  const items = useMemo(
    () =>
      invoices.filter(
        (inv) => inv.role === 'sent' && (inv.status === 1 || inv.status === 2),
      ),
    [invoices],
  )

  return { items, loading }
}

export function ReleaseFundBanner() {
  const { items, loading } = useReleasable()

  if (loading || items.length === 0) return null

  return (
    <section className="mb-6 stagger-item">
      {/* Header card */}
      <div className="island-shell rounded-2xl p-4">
        <header className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(56,161,145,0.18)] text-[var(--lagoon-deep)]">
            <Wallet size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="island-kicker m-0">Action needed</p>
            <h3 className="m-0 text-base font-semibold text-[var(--sea-ink)]">
              {items.length} invoice{items.length > 1 ? 's' : ''} ready to release
            </h3>
          </div>
        </header>

        <p className="m-0 mb-3 text-sm text-[var(--sea-ink-soft)]">
          Payment has been received but the funds are still locked in the vault.
          Release them to transfer the money to your wallet.
        </p>

        {/* List of releasable invoices */}
        <ul className="m-0 flex flex-col gap-2 p-0 list-none">
          {items.map((inv) => (
            <li key={inv.vault}>
              <ReleaseRow invoice={inv} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ReleaseRow({ invoice }: { invoice: Invoice }) {
  const id = invoice.vault.slice(2, 6).toUpperCase()
  const isFull = invoice.status === 2
  const collected = invoice.totalCollected
  const total = invoice.totalAmount

  return (
    <Link
      to="/pay/$vault"
      params={{ vault: invoice.vault }}
      className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-3 no-underline text-inherit transition-all hover:bg-white press-scale"
    >
      {/* Status indicator */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isFull
            ? 'bg-[rgba(56,161,145,0.18)] text-[var(--lagoon-deep)]'
            : 'bg-[#FDE8CC] text-[#B9603A]'
        }`}
      >
        <Wallet size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
          Invoice #{id}
        </p>
        <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
          {isFull ? 'Fully paid' : `${formatAmount(collected)} of ${formatAmount(total)} received`}
          {' \u00b7 '}
          {truncateAddress(invoice.vault)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
          isFull
            ? 'bg-[rgba(56,161,145,0.18)] text-[var(--lagoon-deep)]'
            : 'bg-[#FDE8CC] text-[#B9603A]'
        }`}>
          {isFull ? 'Release' : 'Partial'}
        </span>
        <ArrowRight size={14} className="text-[var(--sea-ink-soft)]" />
      </div>
    </Link>
  )
}
