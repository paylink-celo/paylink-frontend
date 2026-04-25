import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/page-header'
import { hasBackend } from '@/lib/api'

import { ActionPanel } from '@/features/pay/action-panel'
import { ActivityTimeline } from '@/features/pay/activity-timeline'
import { AgentX402Panel } from '@/features/pay/agent-x402-panel'
import { InvoiceHeader } from '@/features/pay/invoice-header'
import { InvoiceSummary } from '@/features/pay/invoice-summary'
import { ReminderButton } from '@/features/pay/reminder-button'
import { ShareSection } from '@/features/pay/share-section'
import { useInvoice } from '@/hooks/read/use-invoice'

export const Route = createFileRoute('/pay/$vault')({ component: PayPage })

function PayPage() {
  const { vault } = Route.useParams()
  const vaultAddr = vault as `0x${string}`
  const { invoice, payerInfo, iDeclined, me, refetch } = useInvoice(vaultAddr)
  const isCreator = Boolean(me && me === invoice.creator)

  return (
    <div className="page-enter page-wrap pb-16 pt-3">
      <PageHeader title="Invoice Details" />
      <InvoiceHeader
        creator={invoice.creator}
        tokenAddr={invoice.tokenAddr}
        totalAmount={invoice.totalAmount}
        dueDate={invoice.dueDate}
        status={invoice.status}
      />
      <InvoiceSummary
        vaultAddr={vaultAddr}
        tokenAddr={invoice.tokenAddr}
        totalAmount={invoice.totalAmount}
        totalCollected={invoice.totalCollected}
        metadata={invoice.metadata}
      />
      <ActionPanel
        vaultAddr={vaultAddr}
        invoice={invoice}
        payerInfo={payerInfo}
        iDeclined={iDeclined}
        me={me}
        onDone={refetch}
      />
      <ShareSection vaultAddr={vaultAddr} />
      {hasBackend() && <ActivityTimeline vaultAddr={vaultAddr} />}
      {hasBackend() && <AgentX402Panel vaultAddr={vaultAddr} />}
      {hasBackend() && isCreator && <ReminderButton />}
    </div>
  )
}
