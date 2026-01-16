'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { DateRange, Range, RangeKeyDict } from 'react-date-range'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'

export interface DateRangeValue {
  from: Date | undefined
  to: Date | undefined
}

interface DateRangePickerProps {
  value?: DateRangeValue
  onChange?: (range: DateRangeValue | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Internal state for the calendar selection
  const [selectionRange, setSelectionRange] = React.useState<Range>({
    startDate: value?.from || new Date(),
    endDate: value?.to || new Date(),
    key: 'selection',
  })

  // Sync internal state with external value
  React.useEffect(() => {
    setSelectionRange({
      startDate: value?.from || new Date(),
      endDate: value?.to || new Date(),
      key: 'selection',
    })
  }, [value?.from, value?.to])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(undefined)
    setSelectionRange({
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    })
  }

  const handleSelect = (ranges: RangeKeyDict) => {
    const selection = ranges.selection
    setSelectionRange(selection)

    // Only call onChange when both dates are different (user completed selection)
    if (selection.startDate && selection.endDate) {
      const startTime = selection.startDate.getTime()
      const endTime = selection.endDate.getTime()

      // Check if this is a completed range (not just clicking the same date)
      if (startTime !== endTime) {
        onChange?.({
          from: selection.startDate,
          to: selection.endDate,
        })
      }
    }
  }

  const handleApply = () => {
    if (selectionRange.startDate && selectionRange.endDate) {
      onChange?.({
        from: selectionRange.startDate,
        to: selectionRange.endDate,
      })
    }
    setIsOpen(false)
  }

  const displayValue = React.useMemo(() => {
    if (!value?.from) return placeholder
    if (!value.to) return format(value.from, 'MMM d, yyyy')
    return `${format(value.from, 'MMM d, yyyy')} - ${format(value.to, 'MMM d, yyyy')}`
  }, [value, placeholder])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          value?.from && 'text-gray-900',
          !value?.from && 'text-gray-500'
        )}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="truncate">{displayValue}</span>
        </div>
        {value?.from && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-3 w-3 text-gray-400" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <style jsx global>{`
            .rdrCalendarWrapper {
              font-size: 14px;
            }
            .rdrDateDisplayWrapper {
              background-color: #f9fafb;
            }
            .rdrDateDisplay {
              margin: 0.5rem;
            }
            .rdrDateDisplayItem {
              border-radius: 0.5rem;
              border-color: #e5e7eb;
            }
            .rdrDateDisplayItem input {
              color: #111827;
            }
            .rdrMonthAndYearPickers select {
              color: #111827;
            }
            .rdrDayNumber span {
              color: #111827;
            }
            .rdrDayPassive .rdrDayNumber span {
              color: #9ca3af;
            }
            .rdrDayToday .rdrDayNumber span:after {
              background: #3b82f6;
            }
            .rdrDay:not(.rdrDayPassive) .rdrInRange ~ .rdrDayNumber span,
            .rdrDay:not(.rdrDayPassive) .rdrStartEdge ~ .rdrDayNumber span,
            .rdrDay:not(.rdrDayPassive) .rdrEndEdge ~ .rdrDayNumber span {
              color: white;
            }
            .rdrStartEdge, .rdrEndEdge, .rdrInRange {
              background: #3b82f6;
            }
            .rdrDayStartPreview, .rdrDayInPreview, .rdrDayEndPreview {
              border-color: #3b82f6;
            }
          `}</style>
          <DateRange
            ranges={[selectionRange]}
            onChange={handleSelect}
            moveRangeOnFirstSelection={false}
            months={2}
            direction="horizontal"
            showDateDisplay={true}
            rangeColors={['#3b82f6']}
          />
          <div className="flex justify-end gap-2 p-3 border-t border-gray-200">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                handleClear({ stopPropagation: () => {} } as React.MouseEvent)
                setIsOpen(false)
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
