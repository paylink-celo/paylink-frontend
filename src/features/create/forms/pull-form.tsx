import { useState } from 'react'
import { useChainId, useConnection } from 'wagmi'
import { toast } from 'sonner'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUserTokenBalance, TOKEN_DECIMALS } from '@/hooks/balance/use-token-balance'
import { useRequestInvoice } from '@/hooks/mutation/use-request-invoice'
import { getAddresses } from '@/lib/addresses/addresses'
import { parseAmount } from '@/lib/format'
import { resolveRecipient } from '@/lib/api'

import { buildMetadataURI } from '../shared/build-metadata-uri'
import { DuePicker } from '../shared/due-picker'
import { ErrorText, FormFooter, PayerWalletInput } from '../shared/form-bits'
import { SOFT_INPUT, SOFT_TEXTAREA } from '../shared/styles'
import { TokenSelect } from '../shared/token-select'
import { amountZ, recipientZ } from '../shared/validators'
import type { AiDraft, TokenSymbol } from '../shared/types'

export function PullForm({ prefill }: { prefill?: AiDraft }) {
  const { address } = useConnection()
  const chainId = useChainId()
  const addrs = getAddresses(chainId)

  const [counterparty, setCounterparty] = useState(prefill?.counterparty ?? '')
  const [amount, setAmount] = useState(prefill?.amount ?? '')
  const [notes, setNotes] = useState(prefill?.notes ?? '')
  const [token, setToken] = useState<TokenSymbol>(prefill?.token ?? 'cUSD')
  const [due, setDue] = useState(prefill?.dueDateIso ?? '')
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  const { userTokenBalanceFormatted } = useUserTokenBalance(token, TOKEN_DECIMALS[token])

  const { status: txStatus, mutation } = useRequestInvoice()
  const busy = txStatus === 'loading' || txStatus === 'confirming'
  const isSuccess = txStatus === 'success'

  async function submit() {
    const result = {
      counterparty: recipientZ.safeParse(counterparty),
      amount: amountZ.safeParse(amount),
    }
    const nextErrs: Record<string, string> = {}
    if (!result.counterparty.success) nextErrs.counterparty = result.counterparty.error.issues[0].message
    if (!result.amount.success) nextErrs.amount = result.amount.error.issues[0].message
    setErrors(nextErrs)
    if (Object.keys(nextErrs).length > 0) return

    if (!address) return toast.error('Connect wallet first')
    if (!addrs.factory) return toast.error('Factory not deployed yet')

    let resolvedCounterparty: `0x${string}`
    try {
      resolvedCounterparty = await resolveRecipient(counterparty)
    } catch (err) {
      setErrors({
        ...nextErrs,
        counterparty: err instanceof Error ? err.message : 'Could not resolve counterparty',
      })
      return
    }

    const encoded = await buildMetadataURI({
      flow: 'pull',
      note: notes,
      token,
      amount,
      dueDateIso: due,
    })

    mutation.mutate({
      factory: addrs.factory as `0x${string}`,
      counterparty: resolvedCounterparty,
      amount: parseAmount(amount),
      notes: encoded,
    })
  }

  if (isSuccess) {
    return (
      <Card className="form-card">
        <CardContent >
          <h3 className="mb-2 text-lg font-semibold">Request sent ✓</h3>
          <p className="mb-4 text-sm text-(--sea-ink-soft)">
            The counterparty will see your request in their Requests inbox.
          </p>
          <a className="btn-secondary" href="/activity">
            View activity
          </a>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="form-card">
        <CardContent className="grid gap-4 p-0">
          <div>
            <Label htmlFor="pull-counterparty" className="field-label mb-2">
              Payer wallet
            </Label>
            <PayerWalletInput
              id="pull-counterparty"
              value={counterparty}
              onChange={setCounterparty}
              scanTitle="Scan counterparty wallet QR"
            />
            <ErrorText message={errors.counterparty} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="field-label mb-2">Token</Label>
              <TokenSelect value={token} onChange={setToken} />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor="pull-amount" className="field-label mb-2">
                  Amount
                </Label>
                <span className="field-label-soft">{userTokenBalanceFormatted}</span>
              </div>
              <Input
                id="pull-amount"
                className={`${SOFT_INPUT} text-right font-semibold`}
                placeholder="0.00"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.trim())}
              />
              <ErrorText message={errors.amount} />
            </div>
          </div>

          <div>
            <Label htmlFor="pull-due" className="field-label mb-2">
              Due date
            </Label>
            <DuePicker id="pull-due" value={due} onChange={setDue} />
          </div>

          <div>
            <Label htmlFor="pull-note" className="field-label mb-2">
              Note <span className="field-label-soft">(optional)</span>
            </Label>
            <Textarea
              id="pull-note"
              className={SOFT_TEXTAREA}
              placeholder="What is this for?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <FormFooter feeLabel={`Estimated Fee: < 0.01 ${token}`}>
        <button className="btn-primary w-full" onClick={submit} disabled={busy}>
          {busy ? 'Processing\u2026' : 'Create invoice'}
        </button>
      </FormFooter>
    </>
  )
}
