import { useEffect } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import type { Abi } from 'viem'
import { toast } from 'sonner'

import { InvoiceVaultAbi } from '@/lib/abis/factory-abi'

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
  const { data: hash, writeContract, isPending } = useWriteContract()
  const { isSuccess, isLoading } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      toast.success('Refunded \u2713')
      onDone()
    }
  }, [isSuccess, onDone])

  if (!hasStake) {
    return <Banner kind="info" title="Expired" body="This invoice is expired. No action needed." />
  }
  return (
    <section className="island-shell rounded-2xl p-5">
      <p className="island-kicker mb-2">Expired</p>
      <p className="mb-3 text-sm text-[var(--sea-ink-soft)]">
        Due date passed. You can pull your deposit back.
      </p>
      <button
        className="btn-primary w-full"
        disabled={isPending || isLoading}
        onClick={() =>
          writeContract({
            abi: InvoiceVaultAbi as Abi,
            address: vaultAddr,
            functionName: 'refund',
          })
        }
      >
        {isLoading ? 'Refunding\u2026' : 'Refund my deposit'}
      </button>
    </section>
  )
}
