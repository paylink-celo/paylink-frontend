import { statusLabel } from '@/lib/format'
import { Banner } from './banner'
import { CreatorActions } from './creator-actions'
import { PayerActions } from './payer-actions'
import { RefundActions } from './refund-actions'
import type { InvoiceState, PayerInfo } from '@/hooks/read/use-invoice'

export function ActionPanel({
  vaultAddr,
  invoice,
  payerInfo,
  me,
  onDone,
}: {
  vaultAddr: `0x${string}`
  invoice: InvoiceState
  payerInfo: PayerInfo | undefined
  me: `0x${string}` | undefined
  onDone: () => void
}) {
  const { creator, tokenAddr, totalAmount, totalCollected, status, isOpen } = invoice
  const remainingMe = payerInfo ? payerInfo.amountDue - payerInfo.amountPaid : 0n
  const canPay = isOpen || (payerInfo?.isAllowed ?? false)

  if (me && me === creator) {
    return <CreatorActions vaultAddr={vaultAddr} status={status} onDone={onDone} />
  }
  if (canPay && remainingMe > 0n && tokenAddr) {
    return (
      <PayerActions
        vaultAddr={vaultAddr}
        tokenAddr={tokenAddr}
        remaining={isOpen ? totalAmount - totalCollected : remainingMe}
        isOpen={isOpen}
        onDone={onDone}
      />
    )
  }
  if (status === 3) {
    return <Banner kind="ok" title="Settled" body="This invoice has been claimed. Thanks!" />
  }
  if (status === 6) {
    return (
      <RefundActions
        vaultAddr={vaultAddr}
        hasStake={Boolean(payerInfo && payerInfo.amountPaid > 0n)}
        onDone={onDone}
      />
    )
  }
  return (
    <Banner
      kind="info"
      title={canPay ? 'Nothing to pay' : 'Not an allowed payer'}
      body={
        canPay
          ? `You've already paid your share. Status: ${statusLabel(status)}.`
          : 'Your wallet is not on the allowed payers list.'
      }
    />
  )
}
