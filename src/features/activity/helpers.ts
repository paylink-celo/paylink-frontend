import type { ActivityItem, Invoice, Tone } from './types'

export function toActivityItem(inv: Invoice): ActivityItem {
  const direction: 'in' | 'out' = inv.role === 'sent' ? 'in' : 'out'
  const { label, tone } = describeStatus(inv.status, inv.role)
  const amount = direction === 'in' ? inv.totalCollected || inv.totalAmount : inv.totalAmount
  return {
    vault: inv.vault,
    title: titleForInvoice(inv),
    counterparty: inv.creator,
    amount,
    direction,
    status: inv.status,
    statusLabel: label,
    tone,
    icon: iconForStatus(inv.status),
  }
}

function titleForInvoice(inv: Invoice): string {
  const id = inv.vault.slice(2, 6).toUpperCase()
  return `Invoice #${id} \u2014 ${inv.role === 'sent' ? 'Incoming' : 'Outgoing'}`
}

export function describeStatus(status: number, role?: 'sent' | 'received'): { label: string; tone: Tone } {
  switch (status) {
    case 2: // Funded — paid but not yet released
      return role === 'sent'
        ? { label: 'RELEASE', tone: 'warning' }
        : { label: 'PAID', tone: 'success' }
    case 3: // Settled — released
      return { label: 'SETTLED', tone: 'success' }
    case 1: // Partial
      return { label: 'PARTIAL', tone: 'success' }
    case 0: // Pending
      return { label: 'PENDING', tone: 'warning' }
    case 6: // Expired
      return { label: 'EXPIRED', tone: 'warning' }
    case 4: // Disputed
      return { label: 'DISPUTED', tone: 'warning' }
    case 5: // Cancelled
      return { label: 'CANCELLED', tone: 'neutral' }
    default:
      return { label: 'COMPLETED', tone: 'neutral' }
  }
}

export function iconForStatus(status: number): ActivityItem['icon'] {
  if (status === 0) return 'pending'
  if (status === 2 || status === 3) return 'invoice'
  return 'receipt'
}
