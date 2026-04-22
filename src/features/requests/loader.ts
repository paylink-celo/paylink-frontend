import type { Abi, PublicClient } from 'viem'

import { InvoiceFactoryAbi } from '@/lib/abis/factory-abi'

import type { InvoiceRequest } from './types'

export async function loadRequestsOnChain(
  client: PublicClient,
  factory: `0x${string}`,
  me: `0x${string}`,
): Promise<InvoiceRequest[]> {
  const [incoming, outgoing, fulfilled] = await Promise.all([
    client.getContractEvents({
      address: factory,
      abi: InvoiceFactoryAbi as Abi,
      eventName: 'InvoiceRequestCreated',
      args: { counterparty: me },
      fromBlock: 'earliest',
    }),
    client.getContractEvents({
      address: factory,
      abi: InvoiceFactoryAbi as Abi,
      eventName: 'InvoiceRequestCreated',
      args: { requester: me },
      fromBlock: 'earliest',
    }),
    client.getContractEvents({
      address: factory,
      abi: InvoiceFactoryAbi as Abi,
      eventName: 'InvoiceRequestFulfilled',
      fromBlock: 'earliest',
    }),
  ])

  const fulfilledMap = new Map<string, `0x${string}`>()
  for (const e of fulfilled) {
    const a = e.args as { requestId: `0x${string}`; vaultAddress: `0x${string}` }
    fulfilledMap.set(a.requestId, a.vaultAddress)
  }

  const rows: InvoiceRequest[] = []
  for (const e of incoming) {
    const a = e.args as {
      requestId: `0x${string}`
      requester: `0x${string}`
      counterparty: `0x${string}`
      amount: bigint
      notes: string
    }
    rows.push({
      requestId: a.requestId,
      counterparty: a.requester,
      amount: a.amount,
      notes: a.notes,
      direction: 'incoming',
      fulfilledVault: fulfilledMap.get(a.requestId),
    })
  }
  for (const e of outgoing) {
    const a = e.args as {
      requestId: `0x${string}`
      requester: `0x${string}`
      counterparty: `0x${string}`
      amount: bigint
      notes: string
    }
    rows.push({
      requestId: a.requestId,
      counterparty: a.counterparty,
      amount: a.amount,
      notes: a.notes,
      direction: 'outgoing',
      fulfilledVault: fulfilledMap.get(a.requestId),
    })
  }
  return rows
}
