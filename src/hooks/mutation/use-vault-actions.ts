import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { writeContract } from 'wagmi/actions'
import { useConnection } from 'wagmi'
import { toast } from 'sonner'

import { InvoiceVaultAbi } from '@/lib/abis/invoice-vault-abi'
import { txExplorerUrl } from '@/lib/chains'
import { isUserRejectedError } from '@/lib/utils/error.utils'
import { useInvalidateAll } from '@/lib/utils/invalidate-queries'
import { waitForTxReceipt } from '@/lib/utils/wait-for-tx'
import type { HexAddress, TxStatus } from '@/lib/utils/tx-types'
import { config } from '@/lib/wagmi'

/* ---------- shared builder ---------- */

type VaultFn = 'release' | 'cancel' | 'refund'

interface VaultMutationCfg {
  fn: VaultFn
  toastId: string
  successMsg: string
}

function useVaultMutation({ fn, toastId, successMsg }: VaultMutationCfg) {
  const { address } = useConnection()
  const invalidateAll = useInvalidateAll()

  const [status, setStatus] = useState<TxStatus>('idle')
  const [txHash, setTxHash] = useState<HexAddress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (vaultAddr: HexAddress) => {
      if (!address) throw new Error('Wallet not connected')

      setStatus('idle')
      setError(null)
      setTxHash(null)

      setStatus('loading')
      toast.loading('Processing\u2026', { id: toastId })

      const hash = await writeContract(config, {
        abi: InvoiceVaultAbi,
        address: vaultAddr,
        functionName: fn,
      })
      setTxHash(hash)

      toast.dismiss(toastId)
      toast.loading('Confirming\u2026', { id: `${toastId}-confirm` })
      const receipt = await waitForTxReceipt(hash)

      toast.dismiss(`${toastId}-confirm`)
      toast.success(successMsg, {
        action: {
          label: 'View tx',
          onClick: () => window.open(txExplorerUrl(hash), '_blank'),
        },
      })

      setStatus('success')
      invalidateAll()
      return receipt
    },
    onError(e) {
      toast.dismiss(toastId)
      toast.dismiss(`${toastId}-confirm`)

      if (isUserRejectedError(e)) {
        setStatus('idle')
        toast.error('Transaction rejected')
      } else {
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Transaction failed')
        toast.error('Transaction failed', {
          description: e instanceof Error ? e.message : undefined,
        })
      }
    },
  })

  const reset = () => {
    setStatus('idle')
    setTxHash(null)
    setError(null)
    mutation.reset()
  }

  return { status, mutation, txHash, error, reset }
}


export function useVaultRelease() {
  return useVaultMutation({
    fn: 'release',
    toastId: 'vault-release',
    successMsg: 'Funds released \u2713',
  })
}

export function useVaultCancel() {
  return useVaultMutation({
    fn: 'cancel',
    toastId: 'vault-cancel',
    successMsg: 'Invoice cancelled',
  })
}

export function useVaultRefund() {
  return useVaultMutation({
    fn: 'refund',
    toastId: 'vault-refund',
    successMsg: 'Deposit refunded \u2713',
  })
}
