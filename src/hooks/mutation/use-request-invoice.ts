import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { writeContract } from 'wagmi/actions'
import { useConnection } from 'wagmi'
import { toast } from 'sonner'

import { InvoiceFactoryAbi } from '@/lib/abis/factory-abi'
import { txExplorerUrl } from '@/lib/chains'
import { isUserRejectedError } from '@/lib/utils/error.utils'
import { waitForTxReceipt } from '@/lib/utils/wait-for-tx'
import type { HexAddress, TxStatus } from '@/lib/utils/tx-types'
import { config } from '@/lib/wagmi'

export interface RequestInvoiceParams {
  factory: HexAddress
  counterparty: HexAddress
  amount: bigint
  notes: string
}

export function useRequestInvoice() {
  const { address } = useConnection()

  const [status, setStatus] = useState<TxStatus>('idle')
  const [txHash, setTxHash] = useState<HexAddress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (params: RequestInvoiceParams) => {
      if (!address) throw new Error('Wallet not connected')

      setStatus('idle')
      setError(null)
      setTxHash(null)

      setStatus('loading')
      toast.loading('Submitting request\u2026', { id: 'request-invoice' })

      const hash = await writeContract(config, {
        abi: InvoiceFactoryAbi,
        address: params.factory,
        functionName: 'requestInvoice',
        args: [params.counterparty, params.amount, params.notes],
      })
      setTxHash(hash)

      toast.dismiss('request-invoice')
      toast.loading('Confirming\u2026', { id: 'request-invoice-confirm' })
      const receipt = await waitForTxReceipt(hash)

      toast.dismiss('request-invoice-confirm')
      toast.success('Request sent \u2713', {
        action: {
          label: 'View tx',
          onClick: () => window.open(txExplorerUrl(hash), '_blank'),
        },
      })

      setStatus('success')
      return receipt
    },
    onError(e) {
      toast.dismiss('request-invoice')
      toast.dismiss('request-invoice-confirm')

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
