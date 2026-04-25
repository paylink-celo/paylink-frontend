/**
 * MiniPay exposes a wallet provider at `window.ethereum` with an `isMiniPay`
 * flag. When our app is opened inside the MiniPay in-app browser we should:
 *   1. auto-connect the injected connector (no UI for connect required)
 *   2. skip the WalletConnect path entirely
 *
 * See https://docs.celo.org/wallet/mini-pay for the official detection guide.
 */

type MiniPayWindow = Window & {
  ethereum?: { isMiniPay?: boolean } & Record<string, unknown>
}

export function detectMiniPay(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean((window as MiniPayWindow).ethereum?.isMiniPay)
}

export function miniPayDeepLink(payUrl: string): string {
  // Custom scheme opens PayMe inside MiniPay if the user has MiniPay installed.
  return `https://minipay.opera.com/open?url=${encodeURIComponent(payUrl)}`
}
