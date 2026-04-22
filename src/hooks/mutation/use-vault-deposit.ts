import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { writeContract } from 'wagmi/actions'
import { erc20Abi } from 'viem'
import { useConnection } from 'wagmi'
import { toast } from 'sonner'

import { InvoiceVaultAbi } from '@/lib/abis/invoice-vault-abi'
import { txExplorerUrl } from '@/lib/chains'
import { isUserRejectedError } from '@/lib/utils/error.utils'
import { waitForTxReceipt } from '@/lib/utils/wait-for-tx'
import type { HexAddress, TxStatus } from '@/lib/utils/tx-types'
import { config } from '@/lib/wagmi'

interface DepositParams {
  vaultAddr: HexAddress
  tokenAddr: HexAddress
  amount: bigint
}

export function useVaultDeposit() {
  const { address } = useConnection()

  const [status, setStatus] = useState<TxStatus>('idle')
  const [txHash, setTxHash] = useState<HexAddress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async ({ vaultAddr, tokenAddr, amount }: DepositParams) => {
      if (!address) throw new Error('Wallet not connected')

      setStatus('idle')
      setError(null)
      setTxHash(null)

      // 1. Approve token spend
      setStatus('loading')
      toast.loading('Approving token spend\u2026', { id: 'vault-deposit' })

      const approveHash = await writeContract(config, {
        abi: erc20Abi,
        address: tokenAddr,
        functionName: 'approve',
        args: [vaultAddr, amount],
      })

      toast.dismiss('vault-deposit')
      toast.loading('Waiting for approval\u2026', { id: 'vault-deposit-confirm' })
      await waitForTxReceipt(approveHash)
      toast.dismiss('vault-deposit-confirm')

      // 2. Deposit into vault
      toast.loading('Depositing\u2026', { id: 'vault-deposit' })

      const depositHash = await writeContract(config, {
        abi: InvoiceVaultAbi,
        address: vaultAddr,
        functionName: 'deposit',
        args: [amount],
      })
      setTxHash(depositHash)

      toast.dismiss('vault-deposit')
      toast.loading('Confirming deposit\u2026', { id: 'vault-deposit-confirm' })
      const receipt = await waitForTxReceipt(depositHash)

      toast.dismiss('vault-deposit-confirm')
      toast.success('Payment sent \u2713', {
        action: {
          label: 'View tx',
          onClick: () => window.open(txExplorerUrl(depositHash), '_blank'),
        },
      })

      setStatus('success')
      return receipt
    },
    onError(e) {
      toast.dismiss('vault-deposit')
      toast.dismiss('vault-deposit-confirm')

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
