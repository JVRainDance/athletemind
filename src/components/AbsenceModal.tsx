'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

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
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (err) {
      console.error('Error recording absence:', err)
      setError('Failed to record absence. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Record Training Absence</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                          {session.start_time} - {session.end_time}
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
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedSession || !selectedReason || loading || (selectedReason === 'Other' && !customReason.trim())}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {loading ? 'Recording...' : 'Record Absence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



