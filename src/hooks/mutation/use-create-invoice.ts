import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { writeContract } from 'wagmi/actions'
import { decodeEventLog } from 'viem'
import { useConnection } from 'wagmi'
import { toast } from 'sonner'

import { InvoiceFactoryAbi } from '@/lib/abis/factory-abi'
import { txExplorerUrl } from '@/lib/chains'
import { isUserRejectedError } from '@/lib/utils/error.utils'
import { waitForTxReceipt } from '@/lib/utils/wait-for-tx'
import type { HexAddress, TxStatus } from '@/lib/utils/tx-types'
import { config } from '@/lib/wagmi'

export interface CreateInvoiceParams {
  factory: HexAddress
  token: HexAddress
  totalAmount: bigint
  dueDate: bigint
  metadataURI: string
  isOpenPayment: boolean
  allowedPayers: HexAddress[]
  payerAmounts: bigint[]
}

export function useCreateInvoice() {
  const { address } = useConnection()

  const [status, setStatus] = useState<TxStatus>('idle')
  const [txHash, setTxHash] = useState<HexAddress | null>(null)
  const [vaultAddr, setVaultAddr] = useState<HexAddress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (params: CreateInvoiceParams) => {
      if (!address) throw new Error('Wallet not connected')

      setStatus('idle')
      setError(null)
      setTxHash(null)
      setVaultAddr(null)

      setStatus('loading')
      toast.loading('Submitting transaction\u2026', { id: 'create-invoice' })

      const hash = await writeContract(config, {
        abi: InvoiceFactoryAbi,
        address: params.factory,
        functionName: 'createInvoice',
        args: [
          params.token,
          params.totalAmount,
          params.dueDate,
          params.metadataURI,
          params.isOpenPayment,
          params.allowedPayers,
          params.payerAmounts,
        ],
      })
      setTxHash(hash)

      toast.dismiss('create-invoice')
      toast.loading('Confirming\u2026', { id: 'create-invoice-confirm' })
      const receipt = await waitForTxReceipt(hash)

      // Extract vault address from InvoiceCreated event
      let vault: HexAddress | null = null
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: InvoiceFactoryAbi,
            data: log.data,
            topics: [...log.topics] as [signature: HexAddress, ...args: HexAddress[]],
          })
          if (decoded.eventName === 'InvoiceCreated') {
            vault = (decoded.args as { vaultAddress: HexAddress }).vaultAddress
            break
          }
        } catch {
          // not our event
        }
      }
      if (vault) setVaultAddr(vault)

      toast.dismiss('create-invoice-confirm')
      toast.success('Invoice created \u2713', {
        action: {
          label: 'View tx',
          onClick: () => window.open(txExplorerUrl(hash), '_blank'),
        },
      })

      setStatus('success')
      return { receipt, vault }
    },
    onError(e) {
      toast.dismiss('create-invoice')
      toast.dismiss('create-invoice-confirm')

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
    setVaultAddr(null)
    setError(null)
    mutation.reset()
  }

  return { status, mutation, txHash, vaultAddr, error, reset }
}
