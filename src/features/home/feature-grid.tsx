import { useNavigate } from '@tanstack/react-router'
import {
  ClockIcon,
  DocumentTextIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

import { FeatureCard } from './feature-card'

export function FeatureGrid() {
  const navigate = useNavigate()
  return (
    <section className="grid grid-cols-2 gap-3">
      <FeatureCard
        icon={<UserGroupIcon className="size-5" />}
        iconBg="bg-[var(--lagoon-soft)]"
        iconColor="text-[var(--lagoon-deep)]"
        title="Split Bills"
        desc="Share expenses easily"
        deco="/Wave%20Line.svg"
        decoVariant="teal"
        onClick={() => navigate({ to: '/create', search: { tab: 'split' } })}
      />
      <FeatureCard
        icon={<DocumentTextIcon className="size-5" />}
        iconBg="bg-[#F8E8E8]"
        iconColor="text-[#A4463A]"
        title="Invoices"
        desc="Track your payments"
        deco="/Rect%20Light.svg"
        decoVariant="warm"
        onClick={() => navigate({ to: '/activity' })}
      />
      <FeatureCard
        icon={<SparklesIcon className="size-5" />}
        iconBg="bg-[rgba(56,161,145,0.15)]"
        iconColor="text-[var(--lagoon-deep)]"
        title="AI Agents"
        desc="Smart payment tools"
        deco="/Sprinkle.svg"
        decoVariant="teal"
        onClick={() => navigate({ to: '/create', search: { tab: 'agent' } })}
      />
      <FeatureCard
        icon={<ClockIcon className="size-5" />}
        iconBg="bg-[#EBEBEB]"
        iconColor="text-[var(--sea-ink-soft)]"
        title="History"
        desc="View past activity"
        deco="/Contour%20Line.svg"
        decoVariant="neutral"
        onClick={() => navigate({ to: '/requests' })}
      />
    </section>
  )
}
