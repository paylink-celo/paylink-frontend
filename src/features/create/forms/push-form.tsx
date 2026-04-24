import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useChainId, useConnection } from 'wagmi'
import { toast } from 'sonner'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUserTokenBalance, TOKEN_DECIMALS } from '@/hooks/balance/use-token-balance'
import { useCreateInvoice } from '@/hooks/mutation/use-create-invoice'
import { getAddresses } from '@/lib/addresses/addresses'
import { parseAmount } from '@/lib/format'
import { resolveRecipient } from '@/lib/api'

import { buildMetadataURI } from '../shared/build-metadata-uri'
import { DuePicker } from '../shared/due-picker'
import { ErrorText, FormFooter, PayerWalletInput } from '../shared/form-bits'
import { SOFT_INPUT, SOFT_TEXTAREA } from '../shared/styles'
import { TokenSelect } from '../shared/token-select'
import { amountZ, dueZ, recipientZ } from '../shared/validators'
import type { AiDraft, TokenSymbol } from '../shared/types'

export function PushForm({ prefill }: { prefill?: AiDraft }) {
  const navigate = useNavigate()
  const { address } = useConnection()
  const chainId = useChainId()
  const addrs = getAddresses(chainId)

  const [payer, setPayer] = useState(prefill?.payers[0]?.address ?? '')
  const [amount, setAmount] = useState(prefill?.amount ?? '')
  const [due, setDue] = useState(prefill?.dueDateIso ?? '')
  const [note, setNote] = useState(prefill?.notes ?? '')
  const [token, setToken] = useState<TokenSymbol>(prefill?.token ?? 'cUSD')
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  const { userTokenBalanceFormatted } = useUserTokenBalance(token, TOKEN_DECIMALS[token])

  const { status: txStatus, mutation, vaultAddr: createdVault } = useCreateInvoice()
  const busy = txStatus === 'loading' || txStatus === 'confirming'

  // Redirect to vault on success
  useEffect(() => {
    if (txStatus === 'success' && createdVault) {
      setTimeout(() => navigate({ to: '/pay/$vault', params: { vault: createdVault } }), 300)
    }
  }, [txStatus, createdVault, navigate])

  async function submit() {
    const result = {
      payer: recipientZ.safeParse(payer),
      amount: amountZ.safeParse(amount),
      due: dueZ.safeParse(due),
    }
    const nextErrs: Record<string, string> = {}
    if (!result.payer.success) nextErrs.payer = result.payer.error.issues[0].message
    if (!result.amount.success) nextErrs.amount = result.amount.error.issues[0].message
    if (!result.due.success) nextErrs.due = result.due.error.issues[0].message
    setErrors(nextErrs)
    if (Object.keys(nextErrs).length > 0) return

    if (!address) return toast.error('Connect wallet first')
    if (!addrs.factory) {
      return toast.error('Factory not deployed yet \u2014 deploy contracts and re-run sync-abi.')
    }

    let resolvedPayer: `0x${string}`
    try {
      resolvedPayer = await resolveRecipient(payer)
    } catch (err) {
      setErrors({
        ...nextErrs,
        payer: err instanceof Error ? err.message : 'Could not resolve payer',
      })
      return
    }

    // USDT is 6-decimal on Celo, cUSD is 18. Encoding with the wrong scale
    // stores a trillion-fold amount on-chain that is effectively unpayable.
    const amt = parseAmount(amount, TOKEN_DECIMALS[token])
    const dueTs = BigInt(Math.floor(Date.parse(due) / 1000))
    const metadataURI = await buildMetadataURI({
      flow: 'push',
      note,
      token,
      amount,
      dueDateIso: due,
    })

    mutation.mutate({
      factory: addrs.factory as `0x${string}`,
      token: (token === 'cUSD' ? addrs.cUSD : addrs.USDT) as `0x${string}`,
      totalAmount: amt,
      dueDate: dueTs,
      metadataURI,
      isOpenPayment: false,
      allowedPayers: [resolvedPayer],
      payerAmounts: [amt],
    })
  }

  return (
    <>
      <Card className="form-card">
        <CardContent className="grid gap-4 p-0">
          <div>
            <Label htmlFor="push-payer" className="field-label mb-2">
              Payer wallet
            </Label>
            <PayerWalletInput id="push-payer" value={payer} onChange={setPayer} />
            <ErrorText message={errors.payer} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="field-label mb-2">Token</Label>
              <TokenSelect value={token} onChange={setToken} />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor="push-amount" className="field-label mb-2">
                  Amount
                </Label>
                <span className="field-label-soft">{userTokenBalanceFormatted}</span>
              </div>
              <Input
                id="push-amount"
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
            <Label htmlFor="push-due" className="field-label mb-2">
              Due date
            </Label>
            <DuePicker id="push-due" value={due} onChange={setDue} />
            <ErrorText message={errors.due} />
          </div>

          <div>
            <Label htmlFor="push-note" className="field-label mb-2">
              Note <span className="field-label-soft">(optional)</span>
            </Label>
            <Textarea
              id="push-note"
              className={SOFT_TEXTAREA}
              placeholder="What is this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
