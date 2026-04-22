const subgraphUrl = (import.meta.env.VITE_SUBGRAPH_URL as string | undefined) ?? ''

export function hasSubgraph(): boolean {
  return subgraphUrl.length > 0
}

export async function graphClient<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
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
