import { useState } from 'react'
import { BellRing } from 'lucide-react'
import { toast } from 'sonner'

import { triggerReminders } from '@/lib/api'

export function ReminderButton() {
  const [busy, setBusy] = useState(false)
  async function send() {
    setBusy(true)
    try {
      const r = await triggerReminders()
      toast.success(
        r.count
          ? `Reminder sent for ${r.count} overdue invoice${r.count === 1 ? '' : 's'}`
          : 'No overdue invoices right now',
      )
    } catch (e) {
      toast.error('Reminder failed: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="island-shell rounded-2xl p-5 mt-4">
      <p className="island-kicker mb-2 flex items-center gap-1">
        <BellRing size={12} /> Reminders
      </p>
      <p className="mb-3 text-sm text-[var(--sea-ink-soft)]">
        Kick the overdue-invoice cron now — sends a Telegram digest if configured.
      </p>
      <button className="btn-secondary w-full" onClick={send} disabled={busy}>
        {busy ? 'Sending…' : 'Send overdue digest'}
      </button>
    </section>
  )
}
