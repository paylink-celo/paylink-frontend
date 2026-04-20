import { activeChain } from '../lib/chains'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-20 border-t border-[var(--line)] px-4 pb-10 pt-10 safe-bottom text-[var(--sea-ink-soft)]">
      <div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="m-0 text-sm">
          &copy; {year} PayLink. Built for Celo MiniPay.
        </p>
        <p className="island-kicker m-0">
          Network: {activeChain.name} · chainId {activeChain.id}
        </p>
      </div>
    </footer>
  )
}
