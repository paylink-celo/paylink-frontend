import { useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'

import CopyButton from '@/components/copy-button'
import { miniPayDeepLink } from '@/lib/minipay'
import { hasBackend, invoicePdfUrl } from '@/lib/api'

export function ShareSection({ vaultAddr }: { vaultAddr: `0x${string}` }) {
  const payUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/pay/${vaultAddr}`
  }, [vaultAddr])

  return (
    <section className="island-shell rounded-2xl p-5 mt-4">
      <p className="island-kicker mb-2">Share</p>
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-xl bg-white p-3 border border-[var(--line)]">
          <QRCodeSVG value={payUrl || vaultAddr} size={140} />
        </div>
        <div className="w-full">
          <p className="mb-2 text-sm text-[var(--sea-ink)] break-all font-mono">{payUrl}</p>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={payUrl} label="Link" />
            <a className="btn-secondary" href={miniPayDeepLink(payUrl)}>
              Open in MiniPay
            </a>
            {hasBackend() && (
              <a
                className="btn-secondary"
                href={invoicePdfUrl(vaultAddr)}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={14} /> PDF
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
