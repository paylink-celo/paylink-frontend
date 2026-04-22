import { useRef, useState } from 'react'
import { useConnection } from 'wagmi'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { MessageCircle, Sparkles, X, Send } from 'lucide-react'

import { backendFetch, hasBackend } from '@/lib/backend'
import { parseInvoice } from '@/lib/api'
import { saveDraft } from '@/lib/ai-draft'

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string }

export default function ChatDrawer() {
  const [open, setOpen] = useState(false)
  const { address } = useConnection()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idCounter = useRef(0)

  function newId(): string {
    idCounter.current += 1
    return `m${idCounter.current}`
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    const userMsg: ChatMessage = { id: newId(), role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setSending(true)
    setError(null)
    try {
      const res = await backendFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as { role?: string; content?: string }
      const reply: ChatMessage = {
        id: newId(),
        role: 'assistant',
        content: body.content ?? '(no reply)',
      }
      setMessages((xs) => [...xs, reply])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSending(false)
    }
  }

  async function draftInvoice() {
    const text = input.trim()
    if (!text || drafting || sending) return
    setDrafting(true)
    setError(null)
    try {
      const res = await parseInvoice(text)
      if (res.error || !res.draft) throw new Error(res.error ?? 'No draft returned')
      saveDraft(res.draft)
      toast.success('Draft invoice ready — review on the Create page')
      setInput('')
      setOpen(false)
      navigate({ to: '/create', search: { tab: res.draft.mode } })
    } catch (err) {
      setError('Draft failed: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setDrafting(false)
    }
  }

  if (!hasBackend()) return null

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI copilot"
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#38A191,#2e8a7c)] text-white shadow-[0_14px_40px_rgba(56,161,145,0.35)]"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {open && (
        <aside
          className="island-shell fixed bottom-36 right-4 z-40 flex h-[min(60vh,420px)] w-[min(92vw,360px)] flex-col rounded-2xl p-4"
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
              <div className="flex flex-col gap-2">
                <p className="m-0 text-[var(--sea-ink-soft)]">
                  Ask anything — or describe an invoice and tap
                  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-[rgba(79,184,178,0.18)] px-1.5 py-0.5 font-semibold text-[var(--lagoon-deep)]">
                    <Sparkles size={11} /> Draft
                  </span>
                  to pre-fill the Create form.
                </p>
                <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
                  Try: <em>“Bill Alice 50 cUSD for April design work due next Friday”</em>.
                </p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`mb-3 ${m.role === 'user' ? 'text-right' : ''}`}>
                <span
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 ${
                    m.role === 'user'
                      ? 'bg-[rgba(79,184,178,0.18)] text-[var(--sea-ink)]'
                      : 'bg-white text-[var(--sea-ink)] border border-[var(--line)]'
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {sending && <p className="text-xs italic text-[var(--sea-ink-soft)]">thinking…</p>}
            {error && (
              <p className="text-xs text-[var(--status-expired)]" role="alert">
                {error}
              </p>
            )}
          </div>

          <form className="mt-3 flex gap-2" onSubmit={submit}>
            <input
              className="input flex-1"
              placeholder="Ask PayLink or describe an invoice…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending || drafting}
            />
            <button
              type="button"
              onClick={draftInvoice}
              className="btn-secondary"
              title="Parse as invoice draft"
              aria-label="Draft invoice from message"
              disabled={!input.trim() || drafting || sending}
            >
              {drafting ? <span className="text-xs">…</span> : <Sparkles size={16} />}
            </button>
            <button
              className="btn-primary"
              type="submit"
              disabled={!input.trim() || sending || drafting}
            >
              <Send size={16} />
            </button>
          </form>
        </aside>
      )}
    </>
  )
}
