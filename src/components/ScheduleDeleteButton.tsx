'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface ScheduleDeleteButtonProps {
  scheduleId: string
  onDeleted: () => void
}

export default function ScheduleDeleteButton({ scheduleId, onDeleted }: ScheduleDeleteButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this schedule item? This will not affect existing sessions.')) {
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('training_schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) {
        console.error('Error deleting schedule:', error)
        alert('Error deleting schedule item. Please try again.')
      } else {
        onDeleted()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}

