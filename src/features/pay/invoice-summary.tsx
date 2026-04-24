import CopyButton from '@/components/copy-button'
import { explorerUrl } from '@/lib/chains'
import { formatAmount, truncateAddress } from '@/lib/format'
import { tokenDecimals } from './helpers'

export function InvoiceSummary({
  vaultAddr,
  tokenAddr,
  totalAmount,
  totalCollected,
  metadata,
}: {
  vaultAddr: `0x${string}`
  /** Token address drives the on-chain decimals used to format amounts. */
  tokenAddr: `0x${string}` | undefined
  totalAmount: bigint
  totalCollected: bigint
  metadata: string
}) {
  const progressPct =
    totalAmount > 0n ? Math.min(100, Number((totalCollected * 100n) / totalAmount)) : 0
  const dec = tokenDecimals(tokenAddr)

  return (
    <section className="island-shell rounded-2xl p-5 mb-4">
      <div className="grid gap-4">
        <div>
          <p className="label">Collected</p>
          <p className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
            {formatAmount(totalCollected, dec)} / {formatAmount(totalAmount, dec)}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(23,58,64,0.08)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#38A191,#2e8a7c)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <div>
          <p className="label">Payment account</p>
          <p className="m-0 font-mono text-sm text-[var(--sea-ink)]">
            {truncateAddress(vaultAddr, 8)}
          </p>
          <div className="mt-2 flex gap-2">
            <CopyButton value={vaultAddr} label="Address" />
            <a className="btn-ghost" href={explorerUrl(vaultAddr)}>
              Explorer
            </a>
          </div>
        </div>
        {metadata && (
          <div>
            <p className="label">Metadata</p>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{metadata}</p>
          </div>
        )}
      </div>
    </section>
  )
}
