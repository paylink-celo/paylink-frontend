export const subgraphUrl = (import.meta.env.VITE_SUBGRAPH_URL as string | undefined) ?? ''

export function hasSubgraph(): boolean {
  return subgraphUrl.length > 0
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!hasSubgraph()) throw new Error('VITE_SUBGRAPH_URL not set')
  const res = await fetch(subgraphUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Subgraph HTTP ${res.status}`)
  const json = (await res.json()) as { data?: T; errors?: unknown[] }
  if (json.errors?.length) throw new Error('Subgraph error: ' + JSON.stringify(json.errors))
  if (!json.data) throw new Error('Subgraph returned no data')
  return json.data
}

export type SgInvoice = {
  id: `0x${string}`
  vault: `0x${string}`
  creator: `0x${string}`
  token: `0x${string}`
  totalAmount: string
  totalCollected: string
  dueDate: string
  status:
    | 'PENDING'
    | 'PARTIAL'
    | 'FUNDED'
    | 'SETTLED'
    | 'DISPUTED'
    | 'CANCELLED'
    | 'EXPIRED'
  metadataURI: string
  isOpenPayment: boolean
}

const INVOICE_FIELDS = /* GraphQL */ `
  fragment InvoiceFields on Invoice {
    id
    vault
    creator
    token
    totalAmount
    totalCollected
    dueDate
    status
    metadataURI
    isOpenPayment
  }
`

export async function fetchInvoicesByUser(user: `0x${string}`): Promise<{
  sent: SgInvoice[]
  received: SgInvoice[]
}> {
  const data = await gql<{
    sent: SgInvoice[]
    received: Array<{ invoice: SgInvoice }>
  }>(
    `${INVOICE_FIELDS}
     query($user: Bytes!) {
       sent: invoices(where: { creator: $user }, orderBy: createdAt, orderDirection: desc, first: 100) {
         ...InvoiceFields
       }
       received: payers(where: { payer: $user }, first: 100) {
         invoice { ...InvoiceFields }
       }
     }`,
    { user: user.toLowerCase() },
  )
  return {
    sent: data.sent,
    received: data.received.map((p) => p.invoice).filter((x): x is SgInvoice => Boolean(x)),
  }
}

const STATUS_MAP: Record<SgInvoice['status'], number> = {
  PENDING: 0,
  PARTIAL: 1,
  FUNDED: 2,
  SETTLED: 3,
  DISPUTED: 4,
  CANCELLED: 5,
  EXPIRED: 6,
}

export function statusFromSubgraph(s: SgInvoice['status']): number {
  return STATUS_MAP[s] ?? 0
}
