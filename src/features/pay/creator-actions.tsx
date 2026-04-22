import { useEffect } from 'react'

import { useVaultRelease, useVaultCancel } from '@/hooks/mutation/use-vault-actions'
import { statusLabel } from '@/lib/format'

export function CreatorActions({
  vaultAddr,
  status: invoiceStatus,
  onDone,
}: {
  vaultAddr: `0x${string}`
  status: number
  onDone: () => void
}) {
  const release = useVaultRelease()
  const cancel = useVaultCancel()

  useEffect(() => {
    if (release.status === 'success' || cancel.status === 'success') onDone()
  }, [release.status, cancel.status, onDone])

  const canRelease = invoiceStatus === 1 || invoiceStatus === 2
  const canCancel = invoiceStatus === 0
  const busyRelease = release.status === 'loading' || release.status === 'confirming'
  const busyCancel = cancel.status === 'loading' || cancel.status === 'confirming'

  return (
    <section className="island-shell rounded-2xl p-5">
      <p className="island-kicker mb-2">Creator actions</p>
      <div className="flex flex-wrap gap-3">
        <button
          className="btn-primary flex-1"
          disabled={!canRelease || busyRelease}
          onClick={() => release.mutation.mutate(vaultAddr)}
        >
          {busyRelease ? 'Releasing\u2026' : 'Release funds'}
        </button>
        <button
          className="btn-ghost flex-1"
          disabled={!canCancel || busyCancel}
          onClick={() => cancel.mutation.mutate(vaultAddr)}
        >
          Cancel
        </button>
      </div>
      {!canRelease && !canCancel && (
        <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">
          No actions available for current status: {statusLabel(invoiceStatus)}.
        </p>
      )}
    </section>
  )
}
