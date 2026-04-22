import { useConnection, useReadContract, useReadContracts } from 'wagmi'
import type { Abi } from 'viem'

import { InvoiceVaultAbi } from '@/lib/abis/invoice-vault-abi'

export type InvoiceState = {
  creator: `0x${string}` | undefined
  tokenAddr: `0x${string}` | undefined
  totalAmount: bigint
  totalCollected: bigint
  dueDate: bigint
  status: number
  metadata: string
  isOpen: boolean
}

export type PayerInfo = {
  amountDue: bigint
  amountPaid: bigint
  isAllowed: boolean
  paidBy: `0x${string}`
}

export function useInvoice(vaultAddr: `0x${string}`): {
  invoice: InvoiceState
  payerInfo: PayerInfo | undefined
  me: `0x${string}` | undefined
  refetch: () => void
} {
  const { address: me } = useConnection()

  const { data: bulk, refetch } = useReadContracts({
    contracts: [
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'creator' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'token' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'totalAmount' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'totalCollected' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'dueDate' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'status' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'metadataURI' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'isOpenPayment' },
    ],
    query: { refetchInterval: 6000 },
  })

  const invoice: InvoiceState = {
    creator: (bulk?.[0]?.result as `0x${string}` | undefined) ?? undefined,
    tokenAddr: (bulk?.[1]?.result as `0x${string}` | undefined) ?? undefined,
    totalAmount: (bulk?.[2]?.result as bigint | undefined) ?? 0n,
    totalCollected: (bulk?.[3]?.result as bigint | undefined) ?? 0n,
    dueDate: (bulk?.[4]?.result as bigint | undefined) ?? 0n,
    status: Number(bulk?.[5]?.result ?? 0),
    metadata: (bulk?.[6]?.result as string | undefined) ?? '',
    isOpen: Boolean(bulk?.[7]?.result ?? false),
  }

  const { data: payerInfoRaw, refetch: refetchPayer } = useReadContract({
    address: vaultAddr,
    abi: InvoiceVaultAbi as Abi,
    functionName: 'payerInfo',
    args: me ? [me] : undefined,
    query: { enabled: Boolean(me), refetchInterval: 6000 },
  })

  return {
    invoice,
    payerInfo: payerInfoRaw as PayerInfo | undefined,
    me,
    refetch: () => {
      void refetch()
      void refetchPayer()
    },
  }
}
