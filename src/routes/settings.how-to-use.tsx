import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowDownRight,
  BarChart3,
  FileText,
  HelpCircle,
  Send,
  Wallet,
} from 'lucide-react'

import { PageHeader } from '@/components/page-header'

export const Route = createFileRoute('/settings/how-to-use')({ component: HowToUsePage })

const steps = [
  {
    icon: <Wallet size={20} />,
    title: 'Connect Wallet',
    desc: 'Open PayMe inside MiniPay. Your wallet connects automatically — no setup needed.',
  },
  {
    icon: <Send size={20} />,
    title: 'Create an Invoice',
    desc: 'Tap Send or Request on the home page. Fill in the amount, token, payer address, and due date. You can also use the AI agent to describe the invoice in natural language.',
  },
  {
    icon: <FileText size={20} />,
    title: 'Share the Link',
    desc: 'Once created, share the invoice link or QR code with the payer. They can open it directly in MiniPay.',
  },
  {
    icon: <ArrowDownRight size={20} />,
    title: 'Receive Payment',
    desc: "The payer deposits funds into the invoice vault. You'll see the status change to Funded in your Invoices page.",
  },
  {
    icon: <BarChart3 size={20} />,
    title: 'Release Funds',
    desc: 'Once payment is received, go to the invoice and tap Release Funds. This transfers the money from the vault to your wallet.',
  },
  {
    icon: <HelpCircle size={20} />,
    title: 'Track Everything',
    desc: 'Use the Invoices page to monitor all invoices. Filter by status — Pending, Release, Settled — to stay on top of your billing.',
  },
]

function HowToUsePage() {
  return (
    <div className="page-enter page-wrap pb-24 pt-3">
      <PageHeader title="How to Use" />

      <div className="grid gap-3">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="island-shell rounded-2xl p-4 flex gap-3 stagger-item"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(56,161,145,0.18)] text-[var(--lagoon-deep)]">
              {step.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--lagoon)] text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="m-0 text-sm font-semibold text-[var(--sea-ink)]">{step.title}</h3>
              </div>
              <p className="m-0 text-sm text-[var(--sea-ink-soft)] leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
