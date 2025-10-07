'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { X, Calendar, Clock, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ExtraSessionModalProps {
  isOpen: boolean
  onClose: () => void
  athleteId: string
}

const SESSION_TYPES = [
  { value: 'make_up', label: 'Make up session' },
  { value: 'additional', label: 'Additional session' },
  { value: 'supplementary', label: 'Supplementary Training' },
  { value: 'other', label: 'Other' },
]

export default function ExtraSessionModal({ isOpen, onClose, athleteId }: ExtraSessionModalProps) {
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [sessionType, setSessionType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!date || !startTime || !endTime || !sessionType) {
      setError('Please fill in all required fields.')
      return
    }

    // Validate date is not in the past
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      setError('Please select a date in the future.')
      return
    }

    // Validate end time is after start time
    if (endTime <= startTime) {
      setError('End time must be after start time.')
      return
    }

    setLoading(true)

    try {
      const { error: insertError } = await supabase
        .from('training_sessions')
        .insert({
          athlete_id: athleteId,
          scheduled_date: date,
          start_time: startTime,
          end_time: endTime,
          session_type: 'extra', // Always set as 'extra' for manually added sessions
          status: 'scheduled'
        })

      if (insertError) {
        console.error('Error creating extra session:', insertError)
        setError('Failed to create extra session. Please try again.')
      } else {
        // Reset form and close modal
        setDate('')
        setStartTime('')
        setEndTime('')
        setSessionType('')
        onClose()
        // Trigger a custom event to refresh dashboard data
        window.dispatchEvent(new CustomEvent('sessionCreated'))
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setDate('')
    setStartTime('')
    setEndTime('')
    setSessionType('')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative p-8 bg-white w-full max-w-md mx-auto rounded-lg shadow-lg border border-gray-200">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={handleClose}
        >
          <X className="h-6 w-6" />
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule Extra Training Session</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center" role="alert">
            <AlertCircle className="h-5 w-5 mr-3" />
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <div className="relative">
              <input
                id="date"
                name="date"
                type="date"
                required
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <div className="relative">
                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  required
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <div className="relative">
                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  required
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type of extra session *
            </label>
            <div className="space-y-3">
              {SESSION_TYPES.map((type) => (
                <div key={type.value} className="flex items-center">
                  <input
                    id={`type-${type.value}`}
                    name="sessionType"
                    type="radio"
                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                    value={type.value}
                    checked={sessionType === type.value}
                    onChange={(e) => setSessionType(e.target.value)}
                  />
                  <label htmlFor={`type-${type.value}`} className="ml-3 block text-sm text-gray-900">
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Scheduling...' : 'Schedule Session'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}





