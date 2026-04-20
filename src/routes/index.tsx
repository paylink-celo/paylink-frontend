import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="page-wrap px-4 pb-12 pt-10 sm:pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">On-chain billing · built for MiniPay</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.05] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Send bills. Get paid. On-chain.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          PayLink turns every invoice into its own on-chain vault. Freelancers,
          merchants, and AI agents can request, pay, and settle in cUSD or USDT
          on Celo — at sub-cent fees, with a full audit trail.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/create" className="btn-primary">
            Create an invoice
          </Link>
          <Link to="/dashboard" className="btn-secondary">
            Open dashboard
          </Link>
        </div>
      </section>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Isolated vaults', 'Every invoice is its own contract. Funds never co-mingle.'],
          ['1-tap MiniPay', 'Deep-links open payments directly in the MiniPay wallet.'],
          ['Split bills', 'Multi-payer invoices with per-payer status tracking.'],
          ['x402 ready', 'AI agents pay HTTP invoices via EIP-3009 signed auths.'],
        ].map(([title, desc], index) => (
          <article
            key={title}
            className="island-shell feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">{title}</h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </article>
        ))}
      </section>
      <section className="island-shell mt-8 rounded-2xl p-6">
        <p className="island-kicker mb-2">How it works</p>
        <ol className="m-0 list-decimal space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
          <li>Creator fills in the amount, due date, and recipient.</li>
          <li>PayLink deploys a dedicated <code>InvoiceVault</code> for that bill.</li>
          <li>Payer(s) deposit cUSD/USDT in one tap. Agents can pay via x402.</li>
          <li>Creator claims funds once the vault is funded. Audit trail stays on-chain.</li>
        </ol>
      </section>
    </main>
  )
}
