import { hasBackend } from '@/lib/backend'
import { pinMetadata } from '@/lib/api'

import type { Tab, TokenSymbol } from './types'

export async function buildMetadataURI(input: {
  flow: Tab
  note: string
  token: TokenSymbol
  amount?: string
  dueDateIso?: string
  extra?: Record<string, unknown>
}): Promise<string> {
  const fallback = input.note?.trim() || `paylink://${input.flow}`
  if (!hasBackend()) return fallback
  try {
    const pinned = await pinMetadata({
      title: input.note?.slice(0, 60) || `PayLink ${input.flow} invoice`,
      note: input.note || undefined,
      tags: [input.flow, input.token],
      extra: {
        flow: input.flow,
        token: input.token,
        amount: input.amount,
        dueDateIso: input.dueDateIso,
        ...input.extra,
      },
    })
    return pinned.uri
  } catch {
    return fallback
  }
}
