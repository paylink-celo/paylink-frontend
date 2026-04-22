import type { Abi, PublicClient } from 'viem'
import { InvoiceFactoryAbi } from '@/lib/abis/factory-abi'
import { InvoiceVaultAbi } from '@/lib/abis/invoice-vault-abi'

import type { Invoice } from './types'

export async function loadInvoicesOnChain(
  client: PublicClient,
  factory: `0x${string}`,
  me: `0x${string}`,
): Promise<Invoice[]> {
  const [asCreator, asPayer] = await Promise.all([
    client.getContractEvents({
      address: factory,
      abi: InvoiceFactoryAbi as Abi,
      eventName: 'InvoiceCreated',
      args: { creator: me },
      fromBlock: 'earliest',
    }),
    client.getContractEvents({
      address: factory,
      abi: InvoiceFactoryAbi as Abi,
      eventName: 'InvoiceCreated',
      fromBlock: 'earliest',
    }),
  ])
  const creatorVaults = asCreator.map((e) => (e.args as { vaultAddress: `0x${string}` }).vaultAddress)
  const allVaults = asPayer.map((e) => ({
    vault: (e.args as { vaultAddress: `0x${string}` }).vaultAddress,
    creator: (e.args as { creator: `0x${string}` }).creator,
  }))
  const receivedChecks = allVaults.filter((v) => v.creator.toLowerCase() !== me.toLowerCase())
  const receivedInfo = await client.multicall({
    allowFailure: true,
    contracts: receivedChecks.map((v) => ({
      address: v.vault,
      abi: InvoiceVaultAbi as Abi,
      functionName: 'payerInfo',
      args: [me],
    })),
  })
  const receivedVaults: `0x${string}`[] = []
  receivedChecks.forEach((v, i) => {
    const r = receivedInfo[i]
    if (r.status === 'success' && r.result) {
      const info = r.result as { isAllowed: boolean; amountDue: bigint; amountPaid: bigint }
      if (info.isAllowed || info.amountDue > 0n || info.amountPaid > 0n) receivedVaults.push(v.vault)
    }
  })
  const uniqueVaults = Array.from(new Set([...creatorVaults, ...receivedVaults]))
  if (uniqueVaults.length === 0) return []
  const reads = uniqueVaults.flatMap((v) => [
    { address: v, abi: InvoiceVaultAbi as Abi, functionName: 'creator' },
    { address: v, abi: InvoiceVaultAbi as Abi, functionName: 'totalAmount' },
    { address: v, abi: InvoiceVaultAbi as Abi, functionName: 'totalCollected' },
    { address: v, abi: InvoiceVaultAbi as Abi, functionName: 'dueDate' },
    { address: v, abi: InvoiceVaultAbi as Abi, functionName: 'status' },
  ])
  const results = await client.multicall({ allowFailure: true, contracts: reads })
  const out: Invoice[] = []
  for (let i = 0; i < uniqueVaults.length; i++) {
    const base = i * 5
    const creator = results[base]?.result as `0x${string}` | undefined
    const totalAmount = results[base + 1]?.result as bigint | undefined
    const totalCollected = results[base + 2]?.result as bigint | undefined
    const dueDate = results[base + 3]?.result as bigint | undefined
    const statusVal = Number(results[base + 4]?.result ?? 0)
    if (!creator || totalAmount === undefined) continue
    out.push({
      vault: uniqueVaults[i],
      creator,
      totalAmount,
      totalCollected: totalCollected ?? 0n,
      dueDate: dueDate ?? 0n,
      status: statusVal,
      role: creator.toLowerCase() === me.toLowerCase() ? 'sent' : 'received',
    })
  }
  out.sort((a, b) => Number(b.dueDate - a.dueDate))
  return out
}
