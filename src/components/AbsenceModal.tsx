'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import * as Dialog from '@radix-ui/react-dialog'

interface TrainingSession {
  id: string
  scheduled_date: string
  start_time: string
  end_time: string
  session_type: string
  status: string
}

interface AbsenceModalProps {
  isOpen: boolean
  onClose: () => void
  athleteId: string
}

const ABSENCE_REASONS = [
  'Unwell',
  'Clash with school event',
  'Clash with social event',
  'Clash with family event',
  'Training cancelled',
  'Other'
]

export default function AbsenceModal({ isOpen, onClose, athleteId }: AbsenceModalProps) {
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [customReason, setCustomReason] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchUpcomingSessions()
    }
  }, [isOpen, athleteId])

  const fetchUpcomingSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('athlete_id', athleteId)
        .in('status', ['scheduled'])
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })

      if (error) throw error
      setSessions(data || [])
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError('Failed to load training sessions')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSession || !selectedReason) return

    setLoading(true)
    setError('')

    try {
      const reason = selectedReason === 'Other' ? customReason : selectedReason
      
      // Update the session status to 'absent' and add absence reason
      const { error: updateError } = await supabase
        .from('training_sessions')
        .update({
          status: 'absent',
          absence_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSession)

      if (updateError) throw updateError

      // Close modal and reset form
      onClose()
      setSelectedSession('')
      setSelectedReason('')
      setCustomReason('')
      
      // Trigger a custom event to refresh dashboard data
      window.dispatchEvent(new CustomEvent('sessionCreated'))
    } catch (err) {
      console.error('Error recording absence:', err)
      setError('Failed to record absence. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-lg bg-white shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <Dialog.Title className="text-lg sm:text-xl font-semibold text-gray-900">
              Record Training Absence
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Session Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select session to record absence:
            </h3>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No upcoming training sessions found
                </p>
              ) : (
                sessions.map((session) => (
                  <label
                    key={session.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSession === session.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="session"
                      value={session.id}
                      checked={selectedSession === session.id}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {new Date(session.scheduled_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(`2000-01-01T${session.start_time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })} - {new Date(`2000-01-01T${session.end_time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Why are you absent from this session?
            </h3>
            <div className="space-y-3">
              {ABSENCE_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedReason === reason
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-900">{reason}</span>
                </label>
              ))}
            </div>

            {/* Custom Reason Input */}
            {selectedReason === 'Other' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify the reason:
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter your reason for absence..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
            <Dialog.Close asChild>
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors min-h-[44px]"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="submit"
              disabled={!selectedSession || !selectedReason || loading || (selectedReason === 'Other' && !customReason.trim())}
              className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors min-h-[44px]"
            >
              {loading ? 'Recording...' : 'Record Absence'}
            </button>
          </div>
        </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}



