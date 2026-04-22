import { useState } from 'react'
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
import { useUserTokenBalance, TOKEN_DECIMALS } from '@/hooks/balance/use-token-balance'

import { buildMetadataURI } from '../shared/build-metadata-uri'
import { FormFooter } from '../shared/form-bits'
import { SOFT_INPUT, SOFT_TEXTAREA } from '../shared/styles'
import { TokenSelect } from '../shared/token-select'
import { amountZ } from '../shared/validators'
import type { TokenSymbol } from '../shared/types'

export function AgentForm() {
  const { address } = useConnection()
  const chainId = useChainId()
  const addrs = getAddresses(chainId)

  const [endpoint, setEndpoint] = useState('')
  const [amount, setAmount] = useState('')
  const [token, setToken] = useState<TokenSymbol>('cUSD')
  const [note, setNote] = useState('')

  const { userTokenBalanceFormatted } = useUserTokenBalance(token, TOKEN_DECIMALS[token])

  const { data: hash, writeContract, isPending } = useWriteContract()
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash })

  async function submit() {
    if (!amountZ.safeParse(amount).success) return toast.error('Invalid amount')
    if (!address) return toast.error('Connect wallet first')
    if (!addrs.factory) return toast.error('Factory not deployed yet')

    const amt = parseAmount(amount)
    const dueTs = BigInt(Math.floor(Date.now() / 1000) + 86400 * 30) // 30 days
    const meta = await buildMetadataURI({
      flow: 'agent',
      note,
      token,
      amount,
      extra: { endpoint: endpoint || undefined },
    })

    writeContract({
      abi: InvoiceFactoryAbi,
      address: addrs.factory as `0x${string}`,
      functionName: 'createInvoice',
      args: [
        (token === 'cUSD' ? addrs.cUSD : addrs.USDT) as `0x${string}`,
        amt,
        dueTs,
        meta,
        true, // open payment — any agent can pay
        [],
        [],
      ],
    })
    toast.info('Submitting transaction\u2026')
  }

  if (isSuccess) {
    return (
      <Card className="form-card">
        <CardContent className="px-5 py-5">
          <h3 className="mb-2 text-lg font-semibold">Agent invoice created ✓</h3>
          <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
            Share the vault address or x402 endpoint with AI agents. Any agent can pay via EIP-3009
            signed authorization.
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
        <CardContent className="px-5 py-5">
          <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
            Create an open-payment invoice that AI agents can pay via x402 (EIP-3009). Any agent
            with the vault address can deposit.
          </p>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="field-label mb-2">Token</Label>
                <TokenSelect value={token} onChange={setToken} />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="agent-amount" className="field-label mb-2">
                    Amount
                  </Label>
                  <span className="field-label-soft">{userTokenBalanceFormatted}</span>
                </div>
                <Input
                  id="agent-amount"
                  className={`${SOFT_INPUT} text-right font-semibold`}
                  placeholder="0.00"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.trim())}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="agent-endpoint" className="field-label mb-2">
                API endpoint <span className="field-label-soft">(optional)</span>
              </Label>
              <Input
                id="agent-endpoint"
                className={SOFT_INPUT}
                placeholder="https://api.example.com/pay"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value.trim())}
              />
            </div>

            <div>
              <Label htmlFor="agent-note" className="field-label mb-2">
                Note <span className="field-label-soft">(optional)</span>
              </Label>
              <Textarea
                id="agent-note"
                className={SOFT_TEXTAREA}
                placeholder="What is this for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <FormFooter feeLabel={`Estimated Fee: < 0.01 ${token}`}>
        <button className="btn-primary w-full" onClick={submit} disabled={isPending || isMining}>
          {isPending ? 'Confirm in wallet\u2026' : isMining ? 'Mining\u2026' : 'Create agent invoice'}
        </button>
      </FormFooter>
    </>
  )
}
