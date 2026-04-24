import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { writeContract } from 'wagmi/actions'
import { useConnection } from 'wagmi'
import { toast } from 'sonner'

import { InvoiceFactoryAbi } from '@/lib/abis/factory-abi'
import { txExplorerUrl } from '@/lib/chains'
import { isUserRejectedError } from '@/lib/utils/error.utils'
import { waitForTxReceipt } from '@/lib/utils/wait-for-tx'
import type { HexAddress, TxStatus } from '@/lib/utils/tx-types'
import { config } from '@/lib/wagmi'

export interface RejectInvoiceRequestParams {
  factory: HexAddress
  requestId: HexAddress
  reason?: string
}

/**
 * Cancels (requester) or declines (counterparty) an invoice request on-chain by
 * calling `InvoiceFactory.rejectInvoiceRequest`. The resulting
 * `InvoiceRequestRejected` event is picked up by the subgraph, which in turn
 * refreshes the request list when the `invoice-requests` query is invalidated.
 */
export function useRejectInvoiceRequest() {
  const { address } = useConnection()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<TxStatus>('idle')
  const [txHash, setTxHash] = useState<HexAddress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (params: RejectInvoiceRequestParams) => {
      if (!address) throw new Error('Wallet not connected')

      setStatus('idle')
      setError(null)
      setTxHash(null)

      setStatus('loading')
      toast.loading('Cancelling request\u2026', { id: 'reject-request' })

      const hash = await writeContract(config, {
        abi: InvoiceFactoryAbi,
        address: params.factory,
        functionName: 'rejectInvoiceRequest',
        args: [params.requestId, params.reason ?? ''],
      })
      setTxHash(hash)

      toast.dismiss('reject-request')
      toast.loading('Confirming\u2026', { id: 'reject-request-confirm' })
      const receipt = await waitForTxReceipt(hash)

      toast.dismiss('reject-request-confirm')
      toast.success('Request cancelled', {
        action: {
          label: 'View tx',
          onClick: () => window.open(txExplorerUrl(hash), '_blank'),
        },
      })

      // Refresh the subgraph-backed list so the cancelled row disappears.
      await queryClient.invalidateQueries({ queryKey: ['invoice-requests'] })

      setStatus('success')
      return receipt
    },
    onError(e) {
      toast.dismiss('reject-request')
      toast.dismiss('reject-request-confirm')

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
