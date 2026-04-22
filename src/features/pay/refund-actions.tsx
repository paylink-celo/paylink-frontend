import { useEffect } from 'react'

import { useVaultRefund } from '@/hooks/mutation/use-vault-actions'
import { Banner } from './banner'

export function RefundActions({
  vaultAddr,
  hasStake,
  onDone,
}: {
  vaultAddr: `0x${string}`
  hasStake: boolean
  onDone: () => void
}) {
  const { status, mutation } = useVaultRefund()

  useEffect(() => {
    if (status === 'success') onDone()
  }, [status, onDone])

  if (!hasStake) {
    return <Banner kind="info" title="Expired" body="This invoice is expired. No action needed." />
  }

  const busy = status === 'loading' || status === 'confirming'

  return (
    <section className="island-shell rounded-2xl p-5">
      <p className="island-kicker mb-2">Expired</p>
      <p className="mb-3 text-sm text-[var(--sea-ink-soft)]">
        Due date passed. You can pull your deposit back.
      </p>
      <button
        className="btn-primary w-full"
        disabled={busy}
        onClick={() => mutation.mutate(vaultAddr)}
      >
        {busy ? 'Refunding\u2026' : 'Refund my deposit'}
      </button>
    </section>
  )
}
