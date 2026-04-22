import StatusBadge from '@/components/status-badge'
import { formatAmount, formatDate, truncateAddress } from '@/lib/format'

import { tokenLabel } from './helpers'

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
  return (
    <header className="mb-5">
      <p className="island-kicker mb-1">Invoice</p>
      <h1 className="display-title text-2xl font-bold text-[var(--sea-ink)]">
        {formatAmount(totalAmount)} {tokenLabel(tokenAddr)}
      </h1>
      <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
        From {creator ? truncateAddress(creator) : '—'} · Due {formatDate(dueDate)}
      </p>
      <div className="mt-2">
        <StatusBadge status={status} />
      </div>
    </header>
  )
}
