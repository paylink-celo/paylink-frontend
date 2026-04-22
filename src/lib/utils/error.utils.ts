const REJECTION_PATTERNS = [
  'user rejected',
  'user denied',
  'rejected the request',
  'user cancelled',
  'action_rejected',
]

/**
 * Returns `true` when the wallet user explicitly rejected/cancelled the tx.
 * Works with MetaMask, WalletConnect, Coinbase, and MiniPay.
 */
export function isUserRejectedError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message.toLowerCase()
      : String(err).toLowerCase()
  return REJECTION_PATTERNS.some((p) => msg.includes(p))
}
