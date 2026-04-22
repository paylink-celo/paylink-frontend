import { useNavigate } from '@tanstack/react-router'
import { ArrowDownToLine, QrCode, Send } from 'lucide-react'

import { ActionButton } from './action-button'

export function ActionRow() {
  const navigate = useNavigate()
  return (
    <section className="flex items-start justify-center gap-5 mb-6">
      <ActionButton
        icon={<Send size={22} className="text-white" />}
        label="Send"
        primary
        onClick={() => navigate({ to: '/create' })}
      />
      <ActionButton
        icon={<ArrowDownToLine size={22} className="text-[var(--lagoon-deep)]" />}
        label="Request"
        onClick={() => navigate({ to: '/create', search: { tab: 'pull' } })}
      />
      <ActionButton
        icon={<QrCode size={22} className="text-[var(--lagoon-deep)]" />}
        label="Scan"
        onClick={() => {
          /* future: global QR scanner */
        }}
      />
    </section>
  )
}
