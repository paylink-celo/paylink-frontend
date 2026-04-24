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
  iDeclined,
  me,
  onDone,
}: {
  vaultAddr: `0x${string}`
  invoice: InvoiceState
  payerInfo: PayerInfo | undefined
  /** True if the current wallet already called `decline()` on this vault. */
  iDeclined: boolean
  me: `0x${string}` | undefined
  onDone: () => void
}) {
  const { creator, tokenAddr, totalAmount, totalCollected, status, isOpen, allPayersDeclined } = invoice
  const remainingMe = payerInfo ? payerInfo.amountDue - payerInfo.amountPaid : 0n
  const canPay = isOpen || (payerInfo?.isAllowed ?? false)

  // Creator view: surface "all payers declined" prompt so they know they can
  // cancel the invoice to unblock refunds / free up the allowance.
  if (me && me === creator) {
    return (
      <>
        {allPayersDeclined && status === 0 && (
          <div className="mb-3">
            <Banner
              kind="info"
              title="All payers declined"
              body="Nobody has agreed to pay. You can cancel this invoice from Creator actions below."
            />
          </div>
        )}
        <CreatorActions vaultAddr={vaultAddr} status={status} onDone={onDone} />
      </>
    )
  }

  // Payer already declined — show a firm, non-actionable banner so they can't
  // be confused into paying something they refused.
  if (iDeclined) {
    return (
      <Banner
        kind="info"
        title="You declined this invoice"
        body="The creator has been notified on-chain. They can now cancel the invoice. No action needed from you."
      />
    )
  }

  if (canPay && remainingMe > 0n && tokenAddr) {
    // Decline is only meaningful for restricted invoices (not open-payment)
    // and only when the vault is still live.
    const canDecline = !isOpen && payerInfo?.isAllowed === true && status === 0
    return (
      <PayerActions
        vaultAddr={vaultAddr}
        tokenAddr={tokenAddr}
        remaining={isOpen ? totalAmount - totalCollected : remainingMe}
        isOpen={isOpen}
        canDecline={canDecline}
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
