import { useState } from 'react'
import { Scanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner'
import { X } from 'lucide-react'

const ADDRESS_RE = /0x[a-fA-F0-9]{40}/u
const PHONE_RE = /\+[1-9]\d{7,14}/u

/**
 * Best-effort extract a recipient identifier from a scanned QR string.
 * Supports:
 *   - raw 0x wallet address
 *   - EIP-681 `ethereum:0x...` and `ethereum:pay-0x...@<chainId>/transfer?...`
 *   - pay links like `https://.../pay/0x...`
 *   - plain E.164 phone numbers (`+62...`)
 */
function extractRecipient(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const addr = trimmed.match(ADDRESS_RE)?.[0]
  if (addr) return addr
  const phone = trimmed.match(PHONE_RE)?.[0]
  if (phone) return phone
  return null
}

export function QrScanner({
  open,
  onClose,
  onDetect,
  title = 'Scan QR code',
}: {
  open: boolean
  onClose: () => void
  onDetect: (value: string) => void
  title?: string
}) {
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function close() {
    setError(null)
    onClose()
  }

  function handleScan(codes: IDetectedBarcode[]) {
    if (!codes || codes.length === 0) return
    const value = codes[0]?.rawValue
    if (!value) return
    const extracted = extractRecipient(value)
    if (!extracted) {
      setError('No wallet address or phone number found in this QR.')
      return
    }
    onDetect(extracted)
    close()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">{title}</p>
          <button
            type="button"
            aria-label="Close scanner"
            onClick={close}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--sea-ink-soft)] hover:bg-[var(--line)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="bg-black">
          <Scanner
            onScan={handleScan}
            onError={(e) =>
              setError(e instanceof Error ? e.message : 'Camera unavailable')
            }
            constraints={{ facingMode: 'environment' }}
            styles={{ container: { width: '100%', aspectRatio: '1 / 1' } }}
            allowMultiple={false}
          />
        </div>

        <div className="px-4 py-3">
          {error ? (
            <p className="m-0 text-xs text-[var(--status-expired)]" role="alert">
              {error}
            </p>
          ) : (
            <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
              Point your camera at a PayMe QR, an `ethereum:` address, or a shared wallet QR.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
