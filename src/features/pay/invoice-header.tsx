import StatusBadge from '@/components/status-badge'
import { formatAmount, formatDate, truncateAddress } from '@/lib/format'
import { urgencyChipClass, urgencyLabel } from '@/features/to-pay/urgency'
import { tokenDecimals, tokenLabel } from './helpers'

// Vault status enum: 0 PENDING, 1 PARTIAL, 2 FUNDED, 3 SETTLED, 4 DISPUTED,
// 5 CANCELLED, 6 EXPIRED. Urgency is only meaningful while funds can still be
// collected — i.e. the invoice is still live.
const ACTIVE_STATUSES = new Set([0, 1, 2])

export function InvoiceHeader({
  creator,
  tokenAddr,
  totalAmount,
  dueDate,
  status,
}: {
  creator: `0x${string}` | undefined
  tokenAddr: `0x${string}` | undefined
  totalAmount: bigint
  dueDate: bigint
  status: number
}) {
  // Derive urgency locally so this header can stand on its own without the
  // useMyToPay hook (header renders on every pay-page visit, even for invoices
  // not assigned to the current wallet).
  const daysUntilDue = Math.floor((Number(dueDate) - Math.floor(Date.now() / 1000)) / 86_400)
  const urgency: 'overdue' | 'dueSoon' | 'future' =
    daysUntilDue < 0 ? 'overdue' : daysUntilDue <= 3 ? 'dueSoon' : 'future'
  const showUrgency = ACTIVE_STATUSES.has(status)

  return (
    <header className="mb-5">
      <p className="island-kicker mb-1">Invoice</p>
      <h1 className="display-title text-2xl font-bold text-(--sea-ink)">
        {formatAmount(totalAmount, tokenDecimals(tokenAddr))} {tokenLabel(tokenAddr)}
      </h1>
      <p className="mt-1 text-sm text-(--sea-ink-soft)">
        From {creator ? truncateAddress(creator) : '—'} · Due {formatDate(dueDate)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        {showUrgency && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${urgencyChipClass(urgency)}`}
          >
            {urgencyLabel({ daysUntilDue })}
          </span>
        )}
      </div>
    </header>
  )
}
