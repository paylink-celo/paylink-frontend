import { waitForTransactionReceipt } from 'wagmi/actions'

import { config } from '@/lib/wagmi'
import type { HexAddress } from './tx-types'

/**
 * Wait for a transaction to be included in a block.
 * Returns the full receipt or throws on reverted / timed-out tx.
 */
export async function waitForTxReceipt(hash: HexAddress) {
  const receipt = await waitForTransactionReceipt(config, { hash })
  if (receipt.status === 'reverted') {
    throw new Error('Transaction reverted')
  }
  return receipt
}
