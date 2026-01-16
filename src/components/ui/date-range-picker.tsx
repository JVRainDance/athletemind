'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { DateRange, DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import 'react-day-picker/dist/style.css'

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
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
        <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <DayPicker
            mode="range"
            selected={value}
            onSelect={(range) => {
              onChange?.(range)
              if (range?.from && range?.to) {
                setIsOpen(false)
              }
            }}
            numberOfMonths={2}
            className="rdp-custom"
            classNames={{
              months: 'flex gap-4',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-medium text-gray-900',
              nav: 'space-x-1 flex items-center',
              nav_button: cn(
                'h-7 w-7 bg-transparent p-0 hover:bg-gray-100 rounded-md',
                'inline-flex items-center justify-center'
              ),
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-gray-500 rounded-md w-9 font-normal text-xs',
              row: 'flex w-full mt-2',
              cell: 'text-center text-sm p-0 relative first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
              day: cn(
                'h-9 w-9 p-0 font-normal',
                'hover:bg-gray-100 rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-primary-500'
              ),
              day_selected: 'bg-primary-600 text-white hover:bg-primary-700',
              day_today: 'bg-gray-100 text-gray-900',
              day_outside: 'text-gray-400 opacity-50',
              day_disabled: 'text-gray-400 opacity-50',
              day_range_middle: 'bg-primary-100 text-primary-900 rounded-none',
              day_hidden: 'invisible',
            }}
          />
          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-200">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onChange?.(undefined)
                setIsOpen(false)
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
