import { useEffect } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import type { Abi } from 'viem'
import { toast } from 'sonner'

import { InvoiceVaultAbi } from '@/lib/abis/factory-abi'
import { statusLabel } from '@/lib/format'

export function CreatorActions({
  vaultAddr,
  status,
  onDone,
}: {
  vaultAddr: `0x${string}`
  status: number
  onDone: () => void
}) {
  const { data: releaseHash, writeContract: doRelease, isPending } = useWriteContract()
  const { isSuccess, isLoading } = useWaitForTransactionReceipt({ hash: releaseHash })
  const { data: cancelHash, writeContract: doCancel, isPending: cancelling } = useWriteContract()
  const { isSuccess: cancelled } = useWaitForTransactionReceipt({ hash: cancelHash })

  useEffect(() => {
    if (isSuccess) {
      toast.success('Released \u2713')
      onDone()
    }
  }, [isSuccess, onDone])
  useEffect(() => {
    if (cancelled) {
      toast.success('Cancelled')
      onDone()
    }
  }, [cancelled, onDone])

  const canRelease = status === 1 || status === 2
  const canCancel = status === 0

  return (
    <section className="island-shell rounded-2xl p-5">
      <p className="island-kicker mb-2">Creator actions</p>
      <div className="flex flex-wrap gap-3">
        <button
          className="btn-primary flex-1"
          disabled={!canRelease || isPending || isLoading}
          onClick={() =>
            doRelease({
              abi: InvoiceVaultAbi as Abi,
              address: vaultAddr,
              functionName: 'release',
            })
          }
        >
          {isLoading ? 'Releasing\u2026' : 'Release funds'}
        </button>
        <button
          className="btn-ghost flex-1"
          disabled={!canCancel || cancelling}
          onClick={() =>
            doCancel({
              abi: InvoiceVaultAbi as Abi,
              address: vaultAddr,
              functionName: 'cancel',
            })
          }
        >
          Cancel
        </button>
      </div>
      {!canRelease && !canCancel && (
        <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">
          No actions available for current status: {statusLabel(status)}.
        </p>
      )}
    </section>
  )
}
