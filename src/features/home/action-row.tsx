import { useNavigate } from '@tanstack/react-router'
import {
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  PaperAirplaneIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline'

import { ActionButton } from './action-button'

export function ActionRow() {
  const navigate = useNavigate()
  return (
    <section className="flex items-start justify-center gap-5 mb-6">
      <ActionButton
        icon={<PaperAirplaneIcon className="size-[22px] -rotate-45 text-white" />}
        label="Send"
        primary
        onClick={() => navigate({ to: '/create' })}
      />
      <ActionButton
        icon={<ArrowDownTrayIcon className="size-[22px] text-[var(--lagoon-deep)]" />}
        label="Request"
        onClick={() => navigate({ to: '/create', search: { tab: 'pull' } })}
      />
      <ActionButton
        icon={<QrCodeIcon className="size-[22px] text-[var(--lagoon-deep)]" />}
        label="Scan"
        onClick={() => {
          /* future: global QR scanner */
        }}
      />
      <ActionButton
        icon={<Cog6ToothIcon className="size-[22px] text-[var(--lagoon-deep)]" />}
        label="Settings"
        onClick={() => navigate({ to: '/settings' })}
      />
    </section>
  )
}
