import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

/**
 * Returns a function that invalidates all invoice/balance-related query caches.
 * Call after any on-chain mutation (deposit, release, cancel, refund, create,
 * confirm request, reject request) to ensure the UI reflects the new state
 * without requiring a manual page refresh.
 */
export function useInvalidateAll() {
  const qc = useQueryClient()

  return useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['invoices'] })
    void qc.invalidateQueries({ queryKey: ['invoice-requests'] })
    void qc.invalidateQueries({ queryKey: ['my-to-pay'] })
    void qc.invalidateQueries({ queryKey: ['tokenBalance'] })
    void qc.invalidateQueries({ queryKey: ['payer-policy'] })
  }, [qc])
}
