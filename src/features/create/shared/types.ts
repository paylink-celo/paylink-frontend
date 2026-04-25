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

export const TAB_META: Array<[Tab, string, string]> = [
  ['push', 'Send', 'Create an invoice and send it to a payer'],
  ['split', 'Split', 'Split a bill equally among multiple payers'],
  ['pull', 'Request', 'Request payment from someone directly'],
  ['agent', 'Agent', 'Let the AI agent draft an invoice for you'],
]
