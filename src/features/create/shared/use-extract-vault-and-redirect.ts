import type { useNavigate } from '@tanstack/react-router'
import { decodeEventLog } from 'viem'
import { toast } from 'sonner'

import { InvoiceFactoryAbi } from '@/lib/abis/factory-abi'

type Receipt =
  | {
      status: string
      logs: readonly { address: string; data: `0x${string}`; topics: readonly `0x${string}`[] }[]
    }
  | undefined

export function useExtractVaultAndRedirect(
  receipt: Receipt,
  navigate: ReturnType<typeof useNavigate>,
) {
  if (!receipt || receipt.status !== 'success') return
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: InvoiceFactoryAbi,
        data: log.data,
        topics: [...log.topics] as [signature: `0x${string}`, ...args: `0x${string}`[]],
      })
      if (decoded.eventName === 'InvoiceCreated') {
        const vault = (decoded.args as { vaultAddress: `0x${string}` }).vaultAddress
        toast.success('Invoice created \u2713')
        setTimeout(() => navigate({ to: '/pay/$vault', params: { vault } }), 300)
        return
      }
    } catch {
      // not our event
    }
  }
}
