import { useQuery } from '@tanstack/react-query'
import { useConnection } from 'wagmi'

import { graphClient, hasSubgraph } from '@/lib/graphql/client'
import { queryPayerPolicyDashboard } from '@/lib/graphql/policy.query'
import type {
  Page,
  SgCreatorPermission,
  SgPolicySetting,
  SgPolicySpend,
} from '@/lib/graphql/types'

type DashboardShape = {
  policy: Page<SgPolicySetting>
  permissions: Page<SgCreatorPermission>
  spends: Page<SgPolicySpend>
}

export type PayerPolicyDashboard = {
  policy: SgPolicySetting | null
  permissions: SgCreatorPermission[]
  spends: SgPolicySpend[]
}

async function fetchDashboard(payer: `0x${string}`): Promise<PayerPolicyDashboard> {
  const data = await graphClient<DashboardShape>(queryPayerPolicyDashboard(), {
    payer: payer.toLowerCase(),
  })
  return {
    policy: data.policy?.items?.[0] ?? null,
    permissions: data.permissions?.items ?? [],
    spends: data.spends?.items ?? [],
  }
}

/**
 * Read the PayerPolicy dashboard for the connected wallet.
 *
 * Returns `null` policy when the user has never configured a policy
 * (or when the subgraph is unavailable — caller should check `isError`).
 */
export function usePayerPolicy() {
  const { address } = useConnection()
  return useQuery({
    queryKey: ['payer-policy', address],
    queryFn: () => fetchDashboard(address!),
    enabled: Boolean(address && hasSubgraph()),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
