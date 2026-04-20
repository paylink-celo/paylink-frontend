import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(label ? `${label} copied` : 'Copied to clipboard')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Copy failed')
    }
  }
  return (
    <button type="button" onClick={onCopy} className="btn-ghost" title="Copy">
      {copied ? <Check size={16} /> : <Copy size={16} />}
      <span className="ml-1 text-xs">{copied ? 'Copied' : label ?? 'Copy'}</span>
    </button>
  )
}
