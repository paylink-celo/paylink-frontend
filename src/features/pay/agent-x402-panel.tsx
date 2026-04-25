import { Bot } from 'lucide-react'

export function AgentX402Panel({ vaultAddr: _vaultAddr }: { vaultAddr: `0x${string}` }) {
  return (
    <section className="island-shell rounded-2xl p-5 mt-4 opacity-60">
      <div className="flex w-full items-center justify-between">
        <p className="island-kicker m-0 flex items-center gap-1">
          <Bot size={12} /> Pay with AI agent (x402)
        </p>
        <span className="inline-flex items-center rounded-full bg-[var(--lagoon-soft)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--lagoon-deep)]">
          Soon
        </span>
      </div>
      <p className="m-0 mt-2 text-sm text-[var(--sea-ink-soft)]">
        AI agents will be able to discover payment terms via HTTP 402 and settle invoices automatically. This feature is coming soon.
      </p>
    </section>
  )
}
