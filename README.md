# PayLink MiniPay
React + Vite + TanStack Router PWA for PayLink on Celo. Uses wagmi / viem for
on-chain reads, talks to the optional [PayLink backend](./backend-docs.md) for
AI, IPFS, PDF, x402 and phone-number resolution.
## Quick start
```sh
bun install
cp .env.example .env            # fill in at least VITE_CHAIN_ID
bun run dev                     # http://localhost:5173
```
The app is fully usable without a backend — AI copilot, IPFS pinning, phone
lookups, PDF export, x402 and the reminder digest are feature-flagged on
`VITE_BACKEND_URL`.
## Environment variables
| Var | Purpose |
|---|---|
| `VITE_CHAIN_ID` | `11142220` = Celo Sepolia, `42220` = Celo Mainnet. |
| `VITE_BACKEND_URL` | Base URL of the PayLink Hono backend. Unlocks AI, IPFS, PDF, x402 and phone resolution. Leave blank to run fully on-chain. |
| `VITE_SUBGRAPH_URL` | Optional Ponder/Goldsky GraphQL endpoint. When set, dashboards and activity feeds use it instead of raw log scanning. |
The .env.example also lists **backend** env vars for cross-reference — those are
consumed by the separate Hono service, not by Vite.
## Routes
- `/` — home, balance + quick actions
- `/create` — send / split / request / agent flows (AI quick-start when backend is set)
- `/activity` — per-user invoice feed (ex-`/dashboard`, linked as "Activity" in the bottom nav)
- `/requests` — incoming / outgoing pull-invoice requests with Pending / Completed tabs
- `/pay/$vault` — invoice detail, payer actions, share link, PDF download, event timeline, x402 discovery, overdue digest trigger
## Backend integration surface
The typed client lives at `src/lib/api.ts` and wraps every backend endpoint
documented in `backend-docs.md`:
- `getInvoice(vault)` / `getInvoiceActivity(vault)` — LRU-cached reads + event timeline
- `invoicePdfUrl(vault)` / `x402PayUrl(vault)` — server-rendered PDF + agent discovery URL
- `pinMetadata(payload)` — invoice JSON → `ipfs://<cid>` (falls back to an inline data URI)
- `resolvePhone(number)` / `resolveRecipient(raw)` — turn `+E.164` into `0x` wallet via SocialConnect
- `parseInvoice(prompt)` — NL → structured draft for the Create form
- `triggerReminders()` — kick the overdue-invoices cron, sends Telegram digest if configured
Creating an invoice without a backend still works — `buildMetadataURI` and
`resolveRecipient` degrade gracefully to plain text / require 0x addresses.
## Scripts
```sh
bun run dev      # Vite dev server with HMR and React Compiler
bun run build    # tsc -b && vite build
bun run preview  # serve ./dist locally
bun run lint     # eslint (typed)
```
## Tech stack
- **React 19** + **React Compiler** + **TanStack Router (file-based)**
- **wagmi v3** + **viem** (Celo Sepolia / Mainnet, auto-connect in MiniPay)
- **Tailwind v4** via `@tailwindcss/vite` + a small custom design token layer
- **qrcode.react**, **sonner**, **lucide-react**, **@ai-sdk/react** for the AI chat drawer
