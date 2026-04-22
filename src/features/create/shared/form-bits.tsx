import { useState } from 'react'
import type { ReactNode } from 'react'
import { Info, QrCode } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { QrScanner } from '@/components/qr-scanner'

import { SOFT_INPUT } from './styles'

export function FormFooter({
  feeLabel = 'Estimated Fee: < 0.01 cUSD',
  children,
}: {
  feeLabel?: string
  children: ReactNode
}) {
  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <span className="fee-note">
        <Info size={14} />
        {feeLabel}
      </span>
      {children}
    </div>
  )
}

export function ErrorText({ message }: { message?: string }) {
  if (!message) return null
  return <span className="mt-1 block text-xs text-[var(--status-expired)]">{message}</span>
}

/** Input with a QR-scan affordance that fills the value when a QR is scanned. */
export function PayerWalletInput({
  id,
  value,
  onChange,
  placeholder = '@username or 0x\u2026',
  scanTitle = 'Scan payer wallet QR',
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  scanTitle?: string
}) {
  const [scanning, setScanning] = useState(false)
  return (
    <>
      <div className="relative">
        <Input
          id={id}
          className={`${SOFT_INPUT} pr-12`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
        />
        <button
          type="button"
          aria-label="Scan QR"
          onClick={() => setScanning(true)}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--lagoon-deep)] hover:bg-[rgba(56,161,145,0.12)]"
        >
          <QrCode size={18} />
        </button>
      </div>
      <QrScanner
        open={scanning}
        onClose={() => setScanning(false)}
        onDetect={(v) => onChange(v)}
        title={scanTitle}
      />
    </>
  )
}
