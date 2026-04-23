# PayLink AI Copilot — Frontend Integration Guide

Panduan pemakaian AI agent PayLink (backed by **ElizaOS** + Vercel AI Gateway,
dengan fallback OpenAI-compatible) dari sisi frontend.

---

## 1. TL;DR

| Endpoint | Guna | Input | Output |
|---|---|---|---|
| `POST /api/ai/chat` | Chat bebas + action routing (overdue / lookup / list invoice) | `{ messages, userAddress? }` | `{ role: 'assistant', content: string }` |
| `POST /api/ai/parse-invoice` | Natural-language → draft invoice | `{ input: string, now?: number }` | `{ draft: AiDraft \| null, message: string }` |

Semua endpoint `POST`, JSON in/out, CORS `*`, tidak butuh auth, **tidak ada
rate-limit** saat ini — front-end wajib debounce input user sendiri.

---

## 2. Prasyarat runtime

### 2.1 Backend harus running
```bash
cd paylink-backend
bun run start    # listen di :3001 secara default
```
Cek: `curl http://127.0.0.1:3001/health` → `{ "ok": true }`.

### 2.2 Env frontend
Di `paylink-frontend/.env`:
```
VITE_BACKEND_URL=http://127.0.0.1:3001
```
Untuk produksi ganti ke URL publik (mis. `https://api.paylink.app`). Helper
`hasBackend()` di `src/lib/backend.ts` return `false` kalau env kosong — chat
drawer (`src/components/chat-drawer.tsx`) otomatis tidak tampil.

### 2.3 Env backend (untuk info / troubleshooting FE dev)
AI agent di backend butuh (minimal):
- `AI_GATEWAY_API_KEY` → Vercel AI Gateway key, atau fallback `OPENAI_API_KEY`
- `AI_MODEL` → default `gpt-4.1-mini` (auto prefix jadi `openai/gpt-4.1-mini` di gateway)
- `SUBGRAPH_URL` → wajib untuk action `GET_INVOICE`, `GET_USER_INVOICES`,
  `GET_OVERDUE`. Tanpa ini, action akan balas `"Subgraph not configured"`.

---

## 3. POST /api/ai/chat

Chat percakapan. Backend akan:
1. **Cek semua PayLink plugin action** (`PARSE_INVOICE`, `GET_INVOICE`,
   `GET_USER_INVOICES`, `GET_OVERDUE`) berdasarkan regex validator masing-masing.
2. Kalau salah satu match, handler action dieksekusi (read subgraph / LLM parse)
   dan hasilnya dikembalikan sebagai `assistant` message.
3. Kalau tidak ada yang match, fallback ke LLM bebas via AI Gateway dengan
   system prompt dari character `PayLink Copilot`.

### 3.1 Request body
```ts
type ChatRequest = {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  userAddress?: `0x${string}`  // optional — dikirim ke WALLET_CONTEXT provider
}
```

- **`messages`**: server mengambil hanya 10 terakhir sebagai konteks dan pesan
  `role: 'user'` terakhir sebagai query utama.
- **`userAddress`**: walaupun optional, WAJIB kirim kalau user sudah connect
  wallet — memungkinkan action "my invoices" tanpa user ketik address manual
  di masa depan.

### 3.2 Response
**Success (200)**:
```json
{ "role": "assistant", "content": "⏰ **1 Overdue:**\n\n1. 0x47bd...7234 — 5.00, due 2026-04-23" }
```

**Error**:
- `400` `{ error: 'Invalid JSON body' }` — body gagal di-parse
- `400` `{ error: 'No user message found' }` — `messages[]` tidak mengandung `role: 'user'`
- `500` `{ error: '<string>' }` — kegagalan runtime (subgraph down, gateway 401, dll.) — **note**: error diformat dengan `String(err)`, jangan tampilkan ke user mentah-mentah.

### 3.3 Action matcher (regex ringkas)

| Action | Trigger (minimal) |
|---|---|
| `PARSE_INVOICE` | kata-kata: `invoice\|buat\|charge\|tagih\|split\|bill\|bayar\|kirim\|send\|create\|bikin` **dan** ada angka (`\d+`) |
| `GET_INVOICE` | kata-kata: `invoice\|status\|cek\|check\|lookup\|detail\|info` **dan** ada alamat `0x` panjang 40 hex |
| `GET_USER_INVOICES` | kata-kata: `list\|all\|show\|daftar\|semua\|invoices\|my\|lihat` **dan** (ada alamat `0x` atau "my/saya … invoice") |
| `GET_OVERDUE` | kata-kata: `overdue\|late\|unpaid\|telat\|jatuh tempo\|belum bayar\|terlambat\|tertunggak` |

Berguna untuk placeholder/hint & onboarding copy.

### 3.4 Contoh konsumsi (sudah ada di `src/components/chat-drawer.tsx`)
```ts path=null start=null
const res = await backendFetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    userAddress: address,   // optional
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  }),
})
if (!res.ok) throw new Error(`HTTP ${res.status}`)
const { content } = (await res.json()) as { role: string; content: string }
```

---

## 4. POST /api/ai/parse-invoice

Paksa jalur `PARSE_INVOICE` tanpa regex filter — cocok untuk tombol "Draft"
di chat drawer yang ingin berubah langsung jadi form.

### 4.1 Request
```ts
type ParseInvoiceRequest = {
  input: string        // natural language, wajib non-empty
  now?: number         // reserved; backend saat ini pakai Date.now() sendiri
}
```

### 4.2 Response

```json
{
  "message": "**Invoice Draft:**\n- Mode: push\n- Token: cUSD\n- Amount: 50 cUSD\n- Due: 2026-05-01\n- Payers:\n  - 0xABCDEF...EF12: 50",
  "draft": {
    "mode": "push",
    "token": "cUSD",
    "amount": "50",
    "dueDateIso": "2026-05-01",
    "notes": "",
    "payers": [{ "address": "0xABCDEF...EF12", "amount": "50" }]
  }
}
```

- **`draft`** — Zod-validated struktur `AiDraft` (lihat `src/lib/api.ts`).
  `null` jika LLM gagal menghasilkan parse yang valid.
- **`message`** — markdown summary siap ditampilkan di chat bubble.

### 4.3 Konsumsi frontend

`src/lib/api.ts` export signature:
```ts path=null start=null
export function parseInvoice(input: string): Promise<{ draft: AiDraft | null; message: string }>
```

Contoh pemakaian (sudah di `src/components/chat-drawer.tsx`):
```ts path=null start=null
const { draft, message } = await parseInvoice(text)
if (!draft) {
  // Surface LLM explanation — biasanya "could not parse" message.
  throw new Error(message || 'Could not parse that into an invoice')
}
saveDraft(draft)
navigate({ to: '/create', search: { tab: draft.mode } })
```

### 4.4 Skrip "ping" testing manual
```bash
curl -s -X POST http://127.0.0.1:3001/api/ai/parse-invoice \
  -H 'content-type: application/json' \
  -d '{"input":"Charge 0xABCDEF1234567890ABCDEF1234567890ABCDEF12 50 cUSD due next Friday"}'
```

---

## 5. Pola UX yang direkomendasikan

### 5.1 Chat drawer (floating button)
Sudah ada di `src/components/chat-drawer.tsx`. Perilaku:
- Tombol `<MessageCircle />` pojok kanan-bawah (`bottom-20 right-4`).
- Kirim `history` + `userAddress` di setiap turn supaya context lengkap.
- Tombol `<Sparkles />` = trigger `parseInvoice()` → `saveDraft()` → navigate
  ke `/create?tab=<mode>` (draft di-restore oleh `routes/create.tsx`).

### 5.2 Inline suggestion di halaman Pay / Requests
Gunakan `chat` dengan prompt pre-filled, contoh pada halaman overdue:
```ts path=null start=null
await fetch('/api/ai/chat', { body: JSON.stringify({
  userAddress: address,
  messages: [{ role: 'user', content: `Any overdue invoices for ${address}?` }],
}) })
```

### 5.3 Debounce + abort
```ts path=null start=null
const ctrl = new AbortController()
const res = await backendFetch('/api/ai/chat', { signal: ctrl.signal, ... })
// ctrl.abort() kalau user menutup drawer
```

### 5.4 Rendering markdown
Backend BOLEH return markdown (`**bold**`, `\n` list, emoji). Minimal render:
- `<span className="whitespace-pre-wrap">{content}</span>` sudah cukup untuk
  list & line-break (sudah dilakukan di chat drawer).
- Untuk bold/italic, tambah lib ringan seperti `react-markdown` (belum dipakai).

---

## 6. Error handling

| Kondisi | Yang dilihat FE | Cara handle |
|---|---|---|
| Backend belum running | `TypeError: Failed to fetch` | Disable chat UI kalau `!hasBackend()`; fallback toast "AI copilot offline" |
| Gateway 401 (key salah) | `500 { error: 'Gateway Error: Unauthorized' }` | Toast "AI service unavailable"; jangan expose detail |
| Subgraph down | `500 { error: 'Error: Unable to connect...' }` saat GET_OVERDUE/GET_INVOICE | Sama seperti di atas; retry dengan react-query `retry: 1` |
| Input kosong untuk parse-invoice | `400 { error: 'Missing input' }` | Disable tombol kalau input kosong (sudah) |
| Input JSON rusak | `400 { error: 'Invalid JSON body' }` | Tidak mungkin kalau pakai `JSON.stringify()` di FE |

Helper yang aman: `requestJson()` di `src/lib/api.ts` sudah lempar `Error`
dengan pesan redacted dari body `{ error }`. Gunakan terus, jangan bypass.

---

## 7. Troubleshooting cepat

1. **Chat drawer tidak muncul** → cek `VITE_BACKEND_URL` di `.env`, restart dev server (`bun dev`).
2. **Reply "Subgraph not configured"** → backend `.env` tidak punya `SUBGRAPH_URL`. Bukan bug FE.
3. **Reply "Unable to connect"** → backend di-start sebelum `SUBGRAPH_URL` di-set. Minta restart backend.
4. **Bahasa balasan selalu inggris padahal user ketik Bahasa Indonesia** → action handler pakai template hardcoded bahasa inggris; fallback LLM mengikuti bahasa user. Kalau mau action pakai bahasa mengikuti user, perlu perubahan di backend action handlers.
5. **Tombol Draft diam** → cek console: kalau `draft` null, `message` berisi alasan dari LLM (biasanya input tidak mengandung amount/payer). Guide user untuk re-phrase.
6. **Response pelan (>5s)** → normal untuk fallback LLM; action (subgraph) harusnya <1s. Pasang loading state "thinking…".

---

## 8. Rencana iterasi berikut (bukan blocking)

- [x] Samakan shape `parse-invoice` — backend sekarang return `{message, draft}`.
- [ ] Tambah streaming SSE ke `/api/ai/chat` supaya UI bisa incremental (`@ai-sdk/react useChat` sudah dipasang di FE, tinggal wire).
- [ ] Rate-limit per-IP di backend `/api/ai/*` (sudah ada helper `src/lib/rate-limit.ts`, belum dipasang).
- [ ] Pass `userAddress` ke semua action provider (saat ini hanya diteruskan
  ke `WALLET_CONTEXT` provider — belum digunakan aktif oleh action).
- [ ] Localize action response template (Indonesia / English) via character config.

---

## 9. Ringkasan cepat untuk PR

File FE yang relevan:
- `src/lib/backend.ts` — base URL + `backendFetch`
- `src/lib/api.ts` — typed helper (`parseInvoice` returns `{draft, message}`)
- `src/lib/ai-draft.ts` — sessionStorage draft store
- `src/components/chat-drawer.tsx` — UI primer
- `src/routes/create.tsx` — mengonsumsi draft via `loadDraft()` on mount
