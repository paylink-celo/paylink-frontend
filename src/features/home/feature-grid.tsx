import { useNavigate } from '@tanstack/react-router'
import { Bot, History, Lock, Split } from 'lucide-react'

import { FeatureCard } from './feature-card'

export function FeatureGrid() {
  const navigate = useNavigate()
  return (
    <section className="grid grid-cols-2 gap-3">
      <FeatureCard
        icon={<Split size={20} />}
        iconBg="bg-[var(--lagoon-soft)]"
        iconColor="text-[var(--lagoon-deep)]"
        title="Split Bills"
        desc="Share expenses easily"
        onClick={() => navigate({ to: '/create', search: { tab: 'split' } })}
      />
      <FeatureCard
        icon={<Lock size={20} />}
        iconBg="bg-[#F8E8E8]"
        iconColor="text-[#A4463A]"
        title="Invoices"
        desc="Track your payments"
        onClick={() => navigate({ to: '/activity' })}
      />
      <FeatureCard
        icon={<Bot size={20} />}
        iconBg="bg-[rgba(56,161,145,0.15)]"
        iconColor="text-[var(--lagoon-deep)]"
        title="AI Agents"
        desc="Smart payment tools"
        onClick={() => navigate({ to: '/create', search: { tab: 'agent' } })}
      />
      <FeatureCard
        icon={<History size={20} />}
        iconBg="bg-[#EBEBEB]"
        iconColor="text-[var(--sea-ink-soft)]"
        title="History"
        desc="View past activity"
        onClick={() => navigate({ to: '/requests' })}
      />
    </section>
  )
}
