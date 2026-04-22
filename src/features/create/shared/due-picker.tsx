import { format as formatDateFn } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { SOFT_INPUT } from './styles'

export function DuePicker({
  id,
  value,
  onChange,
}: {
  id?: string
  value: string
  onChange: (iso: string) => void
}) {
  const selected = value ? new Date(`${value}T00:00:00`) : undefined
  const display = selected ? formatDateFn(selected, 'PPP') : ''
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-label="Pick due date"
          className={`${SOFT_INPUT} flex w-full items-center justify-between text-left`}
        >
          <span
            className={
              display
                ? 'text-[var(--sea-ink)]'
                : 'text-[color-mix(in_oklab,var(--sea-ink-soft)_70%,white_30%)]'
            }
          >
            {display || 'Select date'}
          </span>
          <CalendarIcon size={18} className="text-[var(--lagoon-deep)]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => onChange(d ? formatDateFn(d, 'yyyy-MM-dd') : '')}
          disabled={(d) => d < new Date(new Date().toDateString())}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
