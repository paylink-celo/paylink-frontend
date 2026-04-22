import { useQuery } from '@tanstack/react-query'
import { useConnection } from 'wagmi'

import { graphClient, hasSubgraph } from '@/lib/graphql/client'
import { queryInvoicesByUser } from '@/lib/graphql/invoice.query'
import type { Page, SgInvoice } from '@/lib/graphql/types'

async function fetchInvoices(user: `0x${string}`) {
  const query = queryInvoicesByUser()
  const data = await graphClient<{
    sent: Page<SgInvoice>
    received: Page<{ invoice: SgInvoice | null }>
  }>(query, { user: user.toLowerCase() })

  return {
    sent: data.sent.items,
    received: data.received.items
      .map((p) => p.invoice)
      .filter((x): x is SgInvoice => Boolean(x)),
  }
}

export function useInvoicesByUser() {
  const { address } = useConnection()

  return useQuery({
    queryKey: ['invoices', address],
    queryFn: () => fetchInvoices(address!),
    enabled: Boolean(address && hasSubgraph()),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
