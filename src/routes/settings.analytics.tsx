import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoices } from '@/features/activity/use-invoices'
import { formatAmount } from '@/lib/format'

export const Route = createFileRoute('/settings/analytics')({ component: AnalyticsPage })

type Period = '7d' | '30d' | '90d' | 'all'

const PERIOD_DAYS: Record<Period, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
}

const PERIOD_LABELS: Array<[Period, string]> = [
  ['7d', '7D'],
  ['30d', '30D'],
  ['90d', '90D'],
  ['all', 'All'],
]

function AnalyticsPage() {
  const { invoices, loading } = useInvoices()
  const [period, setPeriod] = useState<Period>('30d')

  const filtered = useMemo(() => {
    const days = PERIOD_DAYS[period]
    if (days === null) return invoices
    const cutoff = BigInt(Math.floor(Date.now() / 1000) - days * 86400)
    return invoices.filter((inv) => inv.createdAt >= cutoff)
  }, [invoices, period])

  const stats = useMemo(() => {
    let totalIncome = 0n
    let totalOutcome = 0n
    let incomeCount = 0
    let outcomeCount = 0
    let pendingCount = 0
    let settledCount = 0

    for (const inv of filtered) {
      if (inv.role === 'sent') {
        totalIncome += inv.totalAmount
        incomeCount++
        if (inv.status === 3) settledCount++
        if (inv.status === 0 || inv.status === 1) pendingCount++
      } else {
        totalOutcome += inv.totalAmount
        outcomeCount++
        if (inv.status === 3) settledCount++
        if (inv.status === 0 || inv.status === 1) pendingCount++
      }
    }

    return {
      totalIncome,
      totalOutcome,
      incomeCount,
      outcomeCount,
      pendingCount,
      settledCount,
      total: filtered.length,
    }
  }, [filtered])

  const series = useMemo(() => buildSeries(filtered, period), [filtered, period])

  if (loading) {
    return (
      <div className="page-enter page-wrap pb-24 pt-3">
        <PageHeader title="Analytics" />
        <div className="grid gap-4">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const incomeNum = Number(stats.totalIncome) / 1e18
  const outcomeNum = Number(stats.totalOutcome) / 1e18
  const total = incomeNum + outcomeNum
  const incomePct = total > 0 ? incomeNum / total : 0
  const outcomePct = total > 0 ? outcomeNum / total : 0

  return (
    <div className="page-enter page-wrap pb-24 pt-3">
      <PageHeader title="Analytics" />

      <div className="segmented mb-4" role="tablist" aria-label="Period">
        {PERIOD_LABELS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={period === k}
            onClick={() => setPeriod(k)}
            className={`segmented-item ${period === k ? 'segmented-item--active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 stagger-item">
        {/* Time-series line chart */}
        <div className="island-shell rounded-2xl p-5">
          <p className="island-kicker m-0 mb-3">Trend</p>
          <LineChart series={series} />
          <div className="mt-3 flex items-center justify-around text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--lagoon-deep)]" />
              <span className="text-[var(--sea-ink-soft)]">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#B9603A]" />
              <span className="text-[var(--sea-ink-soft)]">Outcome</span>
            </div>
          </div>
        </div>

        {/* Donut chart */}
        <div className="island-shell rounded-2xl p-5 flex flex-col items-center">
          <p className="island-kicker m-0 mb-3 self-start">Income vs Outcome</p>
          <DonutChart incomePct={incomePct} outcomePct={outcomePct} total={total} />
          <div className="mt-4 flex w-full items-center justify-around text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--lagoon-deep)]" />
              <span className="text-[var(--sea-ink-soft)]">Income</span>
              <span className="font-semibold text-[var(--sea-ink)]">
                {(incomePct * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#B9603A]" />
              <span className="text-[var(--sea-ink-soft)]">Outcome</span>
              <span className="font-semibold text-[var(--sea-ink)]">
                {(outcomePct * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div className="island-shell rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(56,161,145,0.18)] text-[var(--lagoon-deep)]">
              <ArrowDownRight size={20} />
            </div>
            <div>
              <p className="island-kicker m-0">Total Income</p>
              <p className="m-0 text-2xl font-bold text-[var(--lagoon-deep)] display-title">
                {formatAmount(stats.totalIncome)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--sea-ink-soft)]">
            <span>
              {stats.incomeCount} invoice{stats.incomeCount !== 1 ? 's' : ''} created
            </span>
          </div>
        </div>

        <div className="island-shell rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6DCCB] text-[#B9603A]">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <p className="island-kicker m-0">Total Outcome</p>
              <p className="m-0 text-2xl font-bold text-[#B9603A] display-title">
                {formatAmount(stats.totalOutcome)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--sea-ink-soft)]">
            <span>
              {stats.outcomeCount} invoice{stats.outcomeCount !== 1 ? 's' : ''} paid
            </span>
          </div>
        </div>

        <div className="island-shell rounded-2xl p-4">
          <p className="island-kicker m-0 mb-3">Overview</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="m-0 text-xl font-bold text-[var(--sea-ink)] display-title">
                {stats.total}
              </p>
              <p className="m-0 text-xs text-[var(--sea-ink-soft)]">Total</p>
            </div>
            <div>
              <p className="m-0 text-xl font-bold text-[var(--lagoon-deep)] display-title">
                {stats.settledCount}
              </p>
              <p className="m-0 text-xs text-[var(--sea-ink-soft)]">Settled</p>
            </div>
            <div>
              <p className="m-0 text-xl font-bold text-[#B9603A] display-title">
                {stats.pendingCount}
              </p>
              <p className="m-0 text-xs text-[var(--sea-ink-soft)]">Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type SeriesPoint = { label: string; income: number; outcome: number }

function buildSeries(
  invoices: ReturnType<typeof useInvoices>['invoices'],
  period: Period,
): SeriesPoint[] {
  const days = PERIOD_DAYS[period]
  const now = new Date()
  const buckets = days ?? 30
  const bucketMs = days ? 86400_000 : Math.max(86400_000, deriveBucketMs(invoices))
  const points: SeriesPoint[] = []
  const dayKey = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`

  const startMs = days
    ? now.getTime() - (buckets - 1) * 86400_000
    : earliestDueMs(invoices) ?? now.getTime() - 29 * 86400_000

  for (let i = 0; i < buckets; i++) {
    const start = new Date(startMs + i * bucketMs)
    points.push({ label: dayKey(start), income: 0, outcome: 0 })
  }

  for (const inv of invoices) {
    const ms = Number(inv.createdAt) * 1000
    const idx = Math.floor((ms - startMs) / bucketMs)
    if (idx < 0 || idx >= points.length) continue
    const amount = Number(inv.totalAmount) / 1e18
    if (inv.role === 'sent') points[idx].income += amount
    else points[idx].outcome += amount
  }

  return points
}

function earliestDueMs(invoices: ReturnType<typeof useInvoices>['invoices']): number | null {
  let min: bigint | null = null
  for (const inv of invoices) {
    if (min === null || inv.createdAt < min) min = inv.createdAt
  }
  return min === null ? null : Number(min) * 1000
}

function deriveBucketMs(invoices: ReturnType<typeof useInvoices>['invoices']): number {
  const earliest = earliestDueMs(invoices)
  if (earliest === null) return 86400_000
  const span = Date.now() - earliest
  return Math.max(86400_000, Math.ceil(span / 30))
}

function LineChart({ series }: { series: SeriesPoint[] }) {
  const width = 320
  const height = 160
  const padding = { top: 10, right: 10, bottom: 22, left: 10 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const max = Math.max(
    1,
    ...series.map((p) => Math.max(p.income, p.outcome)),
  )
  const stepX = series.length > 1 ? innerW / (series.length - 1) : innerW

  const point = (i: number, v: number) => {
    const x = padding.left + i * stepX
    const y = padding.top + innerH - (v / max) * innerH
    return { x, y }
  }

  const path = (key: 'income' | 'outcome') => {
    if (series.length === 0) return ''
    return series
      .map((p, i) => {
        const { x, y } = point(i, p[key])
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }

  const labelEvery = Math.max(1, Math.ceil(series.length / 6))

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block"
    >
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + innerH * t}
          y2={padding.top + innerH * t}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={1}
        />
      ))}

      <path d={path('income')} fill="none" stroke="var(--lagoon-deep)" strokeWidth={2} />
      <path d={path('outcome')} fill="none" stroke="#B9603A" strokeWidth={2} />

      {series.map((p, i) => {
        if (i % labelEvery !== 0) return null
        const x = padding.left + i * stepX
        return (
          <text
            key={i}
            x={x}
            y={height - 6}
            fontSize={9}
            textAnchor="middle"
            fill="var(--sea-ink-soft)"
          >
            {p.label}
          </text>
        )
      })}
    </svg>
  )
}

function DonutChart({
  incomePct,
  outcomePct,
  total,
}: {
  incomePct: number
  outcomePct: number
  total: number
}) {
  const size = 200
  const stroke = 28
  const radius = (size - stroke) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const incomeLen = circumference * incomePct
  const outcomeLen = circumference * outcomePct
  const gap = total > 0 && incomePct > 0 && outcomePct > 0 ? 2 : 0

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={stroke}
        />
        {total > 0 && (
          <>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="var(--lagoon-deep)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(incomeLen - gap, 0)} ${circumference}`}
              transform={`rotate(-90 ${center} ${center})`}
            />
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#B9603A"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(outcomeLen - gap, 0)} ${circumference}`}
              strokeDashoffset={-(incomeLen + gap)}
              transform={`rotate(-90 ${center} ${center})`}
            />
          </>
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="m-0 text-xs text-[var(--sea-ink-soft)]">Net Flow</p>
        <p className="m-0 text-xl font-bold text-[var(--sea-ink)] display-title">
          {total.toFixed(2)}
        </p>
      </div>
    </div>
  )
}
