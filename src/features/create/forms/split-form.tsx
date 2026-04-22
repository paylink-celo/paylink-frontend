import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  useChainId,
  useConnection,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { toast } from 'sonner'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InvoiceFactoryAbi } from '@/lib/abis/factory-abi'
import { getAddresses } from '@/lib/addresses/addresses'
import { parseAmount } from '@/lib/format'
import { resolveRecipient } from '@/lib/api'

import { buildMetadataURI } from '../shared/build-metadata-uri'
import { DuePicker } from '../shared/due-picker'
import { FormFooter } from '../shared/form-bits'
import { SOFT_INPUT, SOFT_TEXTAREA } from '../shared/styles'
import { TokenSelect } from '../shared/token-select'
import { useExtractVaultAndRedirect } from '../shared/use-extract-vault-and-redirect'
import { amountZ, dueZ, recipientZ } from '../shared/validators'
import type { AiDraft, TokenSymbol } from '../shared/types'

export function SplitForm({ prefill }: { prefill?: AiDraft }) {
  const navigate = useNavigate()
  const { address } = useConnection()
  const chainId = useChainId()
  const addrs = getAddresses(chainId)

  const initialPayers =
    prefill?.payers && prefill.payers.length >= 2
      ? prefill.payers.map((p) => ({ addr: p.address, amt: p.amount }))
      : [
          { addr: '', amt: '' },
          { addr: '', amt: '' },
        ]
  const [payers, setPayers] = useState<Array<{ addr: string; amt: string }>>(initialPayers)
  const [due, setDue] = useState(prefill?.dueDateIso ?? '')
  const [note, setNote] = useState(prefill?.notes ?? '')
  const [token, setToken] = useState<TokenSymbol>(prefill?.token ?? 'cUSD')

  const total = useMemo(() => {
    try {
      return payers.reduce((acc, p) => (p.amt ? acc + Number(p.amt) : acc), 0)
    } catch {
      return 0
    }
  }, [payers])

  const { data: hash, writeContract, isPending } = useWriteContract()
  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({ hash })
  useExtractVaultAndRedirect(receipt, navigate)

  function addRow() {
    setPayers((xs) => [...xs, { addr: '', amt: '' }])
  }
  function removeRow(i: number) {
    setPayers((xs) => xs.filter((_, idx) => idx !== i))
  }

  async function submit() {
    for (const p of payers) {
      if (!recipientZ.safeParse(p.addr).success)
        return toast.error('Invalid payer (use 0x or +E.164)')
      if (!amountZ.safeParse(p.amt).success) return toast.error('Invalid payer amount')
    }
    if (!dueZ.safeParse(due).success) return toast.error('Pick a valid due date')
    if (!address) return toast.error('Connect wallet first')
    if (!addrs.factory) return toast.error('Factory not deployed yet')

    let resolved: `0x${string}`[]
    try {
      resolved = await Promise.all(payers.map((p) => resolveRecipient(p.addr)))
    } catch (err) {
      return toast.error(err instanceof Error ? err.message : 'Could not resolve payer')
    }

    const amts = payers.map((p) => parseAmount(p.amt))
    const totalWei = amts.reduce((acc, v) => acc + v, 0n)
    const dueTs = BigInt(Math.floor(Date.parse(due) / 1000))
    const metadataURI = await buildMetadataURI({
      flow: 'split',
      note,
      token,
      dueDateIso: due,
      extra: { split: payers.map((p, i) => ({ addr: resolved[i], amount: p.amt })) },
    })

    writeContract({
      abi: InvoiceFactoryAbi,
      address: addrs.factory as `0x${string}`,
      functionName: 'createInvoice',
      args: [
        (token === 'cUSD' ? addrs.cUSD : addrs.USDT) as `0x${string}`,
        totalWei,
        dueTs,
        metadataURI,
        false,
        resolved,
        amts,
      ],
    })
    toast.info('Submitting transaction\u2026')
  }

  return (
    <>
      <Card className="form-card">
        <CardContent className="px-5 py-5">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="field-label mb-2">Token</Label>
                <TokenSelect value={token} onChange={setToken} />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <Label className="field-label mb-2">Total</Label>
                  <span className="field-label-soft">{payers.length} payers</span>
                </div>
                <Input
                  className={`${SOFT_INPUT} text-right font-semibold`}
                  value={total.toFixed(2)}
                  readOnly
                />
              </div>
            </div>

            <div>
              <Label htmlFor="split-due" className="field-label mb-2">
                Due date
              </Label>
              <DuePicker id="split-due" value={due} onChange={setDue} />
            </div>

            <div>
              <Label htmlFor="split-note" className="field-label mb-2">
                Note <span className="field-label-soft">(optional)</span>
              </Label>
              <Textarea
                id="split-note"
                className={SOFT_TEXTAREA}
                placeholder="Dinner at Nikkei, April"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <h3 className="mt-5 mb-2 text-sm font-semibold text-[var(--sea-ink)]">Payers</h3>
          <div className="space-y-3">
            {payers.map((p, i) => (
              <div key={i} className="grid gap-2 grid-cols-[1fr_110px_auto] items-center">
                <Input
                  className={SOFT_INPUT}
                  placeholder="@username or 0x…"
                  value={p.addr}
                  onChange={(e) =>
                    setPayers((xs) =>
                      xs.map((x, idx) => (idx === i ? { ...x, addr: e.target.value.trim() } : x)),
                    )
                  }
                />
                <Input
                  className={`${SOFT_INPUT} text-right font-semibold`}
                  placeholder="0.00"
                  inputMode="decimal"
                  value={p.amt}
                  onChange={(e) =>
                    setPayers((xs) =>
                      xs.map((x, idx) => (idx === i ? { ...x, amt: e.target.value.trim() } : x)),
                    )
                  }
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => removeRow(i)}
                  disabled={payers.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary mt-3" onClick={addRow}>
            + Add payer
          </button>
        </CardContent>
      </Card>

      <FormFooter feeLabel={`Estimated Fee: < 0.01 ${token}`}>
        <button className="btn-primary w-full" onClick={submit} disabled={isPending || isMining}>
          {isPending ? 'Confirm in wallet\u2026' : isMining ? 'Confirming\u2026' : 'Create split bill'}
        </button>
      </FormFooter>
    </>
  )
}
