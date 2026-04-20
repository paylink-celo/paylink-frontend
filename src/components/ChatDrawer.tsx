import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useAccount } from 'wagmi'
import { MessageCircle, X, Send } from 'lucide-react'

import { backendUrl, hasBackend } from '../lib/backend'

export default function ChatDrawer() {
  const [open, setOpen] = useState(false)
  const { address } = useAccount()
  const [input, setInput] = useState('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${backendUrl}/api/ai/chat`,
      body: () => ({ userAddress: address }),
    }),
  })

  if (!hasBackend()) return null

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI copilot"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4fb8b2,#328f97)] text-white shadow-[0_14px_40px_rgba(47,106,74,0.35)]"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <aside
          className="island-shell fixed bottom-24 right-6 z-40 flex h-[min(70vh,520px)] w-[min(92vw,380px)] flex-col rounded-2xl p-4"
          style={{ backdropFilter: 'blur(6px)' }}
        >
          <header className="mb-3 flex items-center justify-between">
            <div>
              <p className="island-kicker m-0">PayLink copilot</p>
              <h3 className="m-0 text-base font-semibold text-[var(--sea-ink)]">Ask anything</h3>
            </div>
            <button onClick={() => setOpen(false)} className="btn-ghost" aria-label="Close">
              <X size={16} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto rounded-xl bg-white/50 p-3 text-sm">
            {messages.length === 0 && (
              <p className="m-0 text-[var(--sea-ink-soft)]">
                Try: <em>"show my overdue invoices"</em> or <em>"what's the status of 0xVault..."</em>
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`mb-3 ${m.role === 'user' ? 'text-right' : ''}`}>
                <span
                  className={`inline-block max-w-[85%] rounded-xl px-3 py-2 ${
                    m.role === 'user'
                      ? 'bg-[rgba(79,184,178,0.18)] text-[var(--sea-ink)]'
                      : 'bg-white text-[var(--sea-ink)] border border-[var(--line)]'
                  }`}
                >
                  {m.parts.map((p, i) => (p.type === 'text' ? <span key={i}>{p.text}</span> : null))}
                </span>
              </div>
            ))}
            {status === 'streaming' && (
              <p className="text-xs italic text-[var(--sea-ink-soft)]">thinking…</p>
            )}
          </div>

          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const text = input.trim()
              if (!text) return
              sendMessage({ text })
              setInput('')
            }}
          >
            <input
              className="input flex-1"
              placeholder="Ask PayLink…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status === 'streaming' || status === 'submitted'}
            />
            <button className="btn-primary" type="submit" disabled={!input.trim()}>
              <Send size={16} />
            </button>
          </form>
        </aside>
      )}
    </>
  )
}
