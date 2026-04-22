import { useState } from 'react'
import { Bot } from 'lucide-react'

import CopyButton from '@/components/copy-button'
import { x402PayUrl } from '@/lib/api'

export function AgentX402Panel({ vaultAddr }: { vaultAddr: `0x${string}` }) {
  const [open, setOpen] = useState(false)
  const url = x402PayUrl(vaultAddr)
  return (
    <section className="island-shell rounded-2xl p-5 mt-4">
      <button
        type="button"
        className="flex w-full items-center justify-between bg-transparent p-0 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <p className="island-kicker m-0 flex items-center gap-1">
          <Bot size={12} /> Pay with AI agent (x402)
        </p>
        <span className="text-sm text-[var(--sea-ink-soft)]">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
            AI agents can discover payment terms via HTTP 402 and settle with an EIP-3009 signed
            authorization. No wallet connection required.
          </p>
          <code className="break-all">{url}</code>
          <CopyButton value={url} label="Copy URL" />
        </div>
      )}
    </section>
  )
}
