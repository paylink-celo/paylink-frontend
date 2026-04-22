import { useQuery } from '@tanstack/react-query'
import { useConnection } from 'wagmi'

import { graphClient, hasSubgraph } from '@/lib/graphql/client'
import { queryInvoiceRequestsByUser } from '@/lib/graphql/invoice-request.query'
import type { Page, SgInvoiceRequest } from '@/lib/graphql/types'

async function fetchRequests(user: `0x${string}`) {
  const query = queryInvoiceRequestsByUser()
  const data = await graphClient<{
    incoming: Page<SgInvoiceRequest>
    outgoing: Page<SgInvoiceRequest>
  }>(query, { user: user.toLowerCase() })

  return {
    incoming: data.incoming?.items ?? [],
    outgoing: data.outgoing?.items ?? [],
  }
}

export function useInvoiceRequestsByUser() {
  const { address } = useConnection()

  return useQuery({
    queryKey: ['invoice-requests', address],
    queryFn: () => fetchRequests(address!),
    enabled: Boolean(address && hasSubgraph()),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
