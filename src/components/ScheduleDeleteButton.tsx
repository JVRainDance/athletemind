'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ScheduleDeleteButtonProps {
  scheduleId: string
}

export default function ScheduleDeleteButton({ scheduleId }: ScheduleDeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
        toast.error('Error deleting schedule item', {
          description: 'Please try again or contact support'
        })
      } else {
        toast.success('Schedule deleted successfully')
        router.refresh()
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      aria-label="Delete schedule item"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}

