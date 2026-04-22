# PayLink Backend

Long-running Hono server powered by **Bun** and **ElizaOS v2**, wrapping the on-chain PayLink contracts. Optimized
for a self-hosted VPS (Docker Compose + Nginx), not serverless.

## Endpoints

### Invoice
- `GET /api/invoice/:vault` — read vault state (subgraph → on-chain fallback, LRU cached)
- `GET /api/invoice/:vault/pay` — HTTP 402 + x402 headers (agent discovery)
- `POST /api/invoice/:vault/pay` — accepts EIP-3009 signed auth, relays `x402Pay()`
- `GET /api/invoice/:vault/activity` — chronological event timeline (Deposited / Released / Refunded / X402PaymentReceived / lifecycle)

### Identity / SocialConnect
- `GET /api/resolve/phone?number=+62xxx` — resolve E.164 phone to Celo wallet addresses via ODIS + `FederatedAttestations`

### Metadata & documents
- `POST /api/metadata/pin` — pin invoice JSON to IPFS (Pinata) or data URI fallback
- `GET /api/pdf/:vault` — render invoice PDF (cached per-state)

### AI
- `POST /api/ai/parse-invoice` — NL → structured invoice draft
- `POST /api/ai/chat` — streaming AI copilot (subgraph tools)

### Ops
- `GET /api/cron/reminders` — overdue invoices + Telegram alert (also scheduled inline via node-cron)
- `GET /metrics` — Prometheus scrape (restricted to internal network in Nginx)
- `GET /health` — liveness probe for Docker / load balancers

## Integrations

- **SocialConnect** — phone number → wallet lookup via ODIS + on-chain `FederatedAttestations`. Trusted issuers on mainnet: Kaala, Libera, and your own issuer key.
- **Telegram Bot** — overdue invoices auto-posted to a configured chat/channel when cron fires. Batched 20 items per message.
- **Ponder / Goldsky subgraph** — used as the fast path for invoice reads, dashboard, activity feed, AI tools, and cron. RPC fallback kicks in when unavailable.
- **Pinata IPFS** — invoice metadata pinning (falls back to inline data URI when not configured).
- **ElizaOS v2** — Autonomous agent framework powering the `PayLink Copilot` character with custom actions (`PARSE_INVOICE`, `GET_INVOICE`, etc.) using a Vercel AI Gateway proxy.

## Performance features (for VPS)

- Structured JSON logs via **pino**
- Content-negotiated gzip compression (skipped automatically for `application/pdf` and any response with `Cache-Control: no-transform` — e.g. AI streaming)
- **LRU cache** for invoice reads (TTL configurable via `CACHE_TTL_MS`)
- **PDF cache** keyed by `vault:status:totalCollected` — auto-invalidates on state change
- **viem batching**: `http({ batch: { batchSize: 1024, wait: 16 } })`
- **undici keep-alive** global dispatcher (connections: 64 per origin)
- **Prometheus** metrics: HTTP histogram, cache hit/miss counters, x402 relay counter, overdue gauge
- Graceful SIGTERM/SIGINT shutdown
- Inline `node-cron` reminder (no external scheduler needed)

## Security & abuse controls

- **Per-IP rate limiting** on costly endpoints (tunable via env):
  - `/api/resolve/phone` (burns ODIS quota / cUSD) — default **10 req / 60 s**
  - `POST /api/invoice/:vault/pay` (burns relayer gas) — default **30 req / 60 s**
- **Strict input validation** on `POST /pay`: address/bytes32/bigint types, ECDSA `v ∈ {27, 28}`, pre-flight expiry window check so garbage is rejected before touching the relayer.
- **Error redaction** in production (`NODE_ENV=production`): internal stack traces are never returned to callers.
- **ODIS quota pre-flight**: SocialConnect lookup fails fast with HTTP **402** when issuer quota is exhausted, instead of silent 500s.
- **Cache invalidation** on every successful `x402Pay` relay (both invoice + PDF caches).
- **CORS** wide open (`*`) because the backend is intended as a public API — put a WAF or IP allowlist in front if you want to restrict.

## Local dev

The dev/start scripts auto-load `.env` via Node's native `--env-file-if-exists` flag — no `dotenv` import required.

```sh
cp .env.example .env            # minimal: AI key + SUBGRAPH_URL + X402_RELAYER_KEY
bun install
bun run sync:abis               # copies ABIs from ../paylink-contract/out/
bun run dev                     # http://localhost:3001 (bun --hot)
```

## Docker Compose (VPS)

The repo ships with `Dockerfile` (multi-stage, Node 22 Alpine, tini PID 1) and
`docker-compose.yml` which runs the backend + an Nginx reverse proxy on the
same bridge network.

```sh
# 1. Sync ABIs on the host (reads ../paylink-contract/out/) or commit them.
pnpm sync:abis

# 2. Populate .env (see .env.example).
cp .env.example .env && $EDITOR .env

# 3. Put TLS certs in nginx/certs/ (fullchain.pem + privkey.pem).
#    Easiest path with certbot:
#    sudo certbot certonly --standalone -d api.yourdomain.com
#    sudo cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem nginx/certs/
#    sudo cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem  nginx/certs/

# 4. Build + run.
docker compose up -d --build

# 5. Tail logs / metrics.
docker compose logs -f backend
curl -k https://localhost/health
curl -k https://localhost/metrics   # must come from allowed IP
```

`nginx/paylink.conf` handles:
- HTTP → HTTPS redirect
- HTTP/2 + TLS 1.2/1.3
- Streaming passthrough for `/api/ai/chat` (no buffering)
- `/metrics` ACL (Docker private nets + localhost)
- Keep-alive to the upstream container

## Env vars

| Var | Default | Notes |
|---|---|---|
| `NODE_ENV` | `production` | |
| `HOST` | `0.0.0.0` | |
| `PORT` | `3001` | |
| `LOG_LEVEL` | `info` | pino level |
| `CHAIN_ID` | `11142220` | Celo Sepolia |
| `CELO_SEPOLIA_RPC_URL`, `CELO_RPC_URL` | Forno defaults | |
| `FACTORY_ADDRESS` | deployed Sepolia address | |
| `SUBGRAPH_URL` | unset | Ponder/Goldsky GraphQL endpoint |
| `X402_RELAYER_KEY` | unset | private key to submit `x402Pay()` |
| `PINATA_JWT` | unset | optional IPFS pinning |
| `AI_MODEL` | `openai/gpt-4.1-mini` | AI Gateway model id |
| `AI_GATEWAY_API_KEY` / `OPENAI_API_KEY` | unset | one required |
| `CACHE_TTL_MS` | `5000` | invoice LRU TTL |
| `REMINDER_CRON` | `0 9 * * *` | UTC cron |
| `TELEGRAM_BOT_TOKEN` | unset | BotFather token (enables reminder delivery) |
| `TELEGRAM_CHAT_ID` | unset | Target chat / channel id |
| `SC_ISSUER_KEY` | unset | ODIS issuer private key (falls back to `X402_RELAYER_KEY`) |
| `FEDERATED_ATTESTATIONS_ADDRESS` | auto | Override the FederatedAttestations contract address |
| `RESOLVE_RATE_MAX` | `10` | Max `/api/resolve/phone` requests per window per IP |
| `RESOLVE_RATE_WINDOW_MS` | `60000` | Window for the resolve rate limiter |
| `X402_RATE_MAX` | `30` | Max `POST /api/invoice/:vault/pay` per window per IP |
| `X402_RATE_WINDOW_MS` | `60000` | Window for the x402 relay rate limiter |

## Updating

```sh
git pull
bun run sync:abis               # only if contracts changed
docker compose up -d --build    # zero-downtime thanks to healthcheck + compose
```

## x402 flow

1. Agent → `GET /api/invoice/0xVault/pay` → `HTTP 402` + headers:
   ```
   X-Payment-Amount: 100000000000000000000
   X-Payment-Currency: cUSD
   X-Payment-Token: 0xdE9e4C3c…0aB00b
   X-Payment-Recipient: 0xVault…
   X-Payment-Chain: eip155:11142220
   X-Payment-Scheme: eip-3009
   ```
2. Agent signs EIP-3009 `transferWithAuthorization` and POSTs `{from, value, validAfter, validBefore, nonce, v, r, s}`.
3. Relayer wallet calls `InvoiceVault.x402Pay()` → response `{txHash, explorer}`.
4. Invoice LRU + PDF cache are invalidated automatically.

## SocialConnect (phone → wallet)

```sh
curl "https://api.yourdomain.com/api/resolve/phone?number=%2B6281234567890"
```

Response:
```json
{
  "phone": "+6281234567890",
  "addresses": ["0xabc..."],
  "issuers": ["0x6549...", "0x3886...", "0xyourIssuer"]
}
```

Notes:
- Each call consumes 1 ODIS quota unit. `SC_ISSUER_KEY` must hold a small cUSD balance (~0.01 cUSD buys ~1000 lookups).
- Most active attestations are on **Celo Mainnet**. On Sepolia the lookup may return no results.
- Results are not cached server-side since attestations can change.

## Telegram reminders

Setup:
1. Create a bot with [@BotFather](https://t.me/BotFather) → `/newbot` → copy the token.
2. Add the bot to a group or channel. Send any message there.
3. Run `curl https://api.telegram.org/bot<TOKEN>/getUpdates` → copy `chat.id`.
4. Set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` in `.env` and restart.

The inline cron runs daily at `REMINDER_CRON` (default `0 9 * * *` UTC) and also on-demand via `GET /api/cron/reminders`. Batching keeps messages under Telegram's 4096-char limit.

## Activity feed

```sh
curl https://api.yourdomain.com/api/invoice/0xVault.../activity
```

Returns newest-first timeline with `type`, `actor`, `amount`, `txHash`, `explorerTx`, etc. Prefers subgraph; falls back to `getContractEvents` when subgraph is unavailable.