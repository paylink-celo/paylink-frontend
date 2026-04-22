export type Tab = 'push' | 'split' | 'pull' | 'agent'

export type TokenSymbol = 'cUSD' | 'USDT'

export type AiDraft = {
  mode: Tab
  token: TokenSymbol
  amount: string
  dueDateIso: string
  notes: string
  payers: Array<{ address: string; amount: string }>
  counterparty?: string
}

export const TAB_VALUES: readonly Tab[] = ['push', 'split', 'pull', 'agent']

export const TAB_META: Array<[Tab, string]> = [
  ['push', 'Send'],
  ['split', 'Split'],
  ['pull', 'Request'],
  ['agent', 'Agent'],
]
