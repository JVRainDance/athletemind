'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Calendar, Clock, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { formatTimeInTimezone } from '@/lib/timezone-utils'
import { SessionCardSkeleton } from '@/components/skeletons/session-card-skeleton'
import { toast } from '@/lib/toast'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'

interface TrainingSession {
  id: string
  scheduled_date: string
  start_time: string
  end_time: string
  session_type: 'regular' | 'competition' | 'extra'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'absent'
  absence_reason?: string
}

const ABSENCE_REASONS = [
  'Unwell',
  'Injured', 
  'Clash with School Event/Camp',
  'Clash with Social Event',
  'Clash with Family Event/Holiday',
  'Training Cancelled',
  'Other'
]

export default function SessionsPage() {
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [userTimezone, setUserTimezone] = useState('UTC')
  const [loading, setLoading] = useState(true)
  const [showAbsenceForm, setShowAbsenceForm] = useState<string | null>(null)
  const [absenceReason, setAbsenceReason] = useState('')
  const router = useRouter()
  const { confirm } = useConfirmDialog()

  useEffect(() => {
    fetchSessions()

    // Listen for session creation events to refresh data
    const handleSessionCreated = () => {
      fetchSessions()
    }

    window.addEventListener('sessionCreated', handleSessionCreated)

    return () => {
      window.removeEventListener('sessionCreated', handleSessionCreated)
    }
  }, [])

  const fetchSessions = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Fetch user's timezone from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profileData?.timezone) {
        setUserTimezone(profileData.timezone)
      }

      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('athlete_id', session.user.id)
        .order('scheduled_date', { ascending: false })

      if (error) {
        console.error('Error fetching sessions:', error)
      } else {
        setSessions(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async (sessionId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('training_sessions')
        .update({ status: 'in_progress' })
        .eq('id', sessionId)

      if (error) {
        console.error('Error starting session:', error)
        toast.error('Error starting session. Please try again.')
      } else {
        router.push(`/dashboard/athlete/sessions/${sessionId}/training`)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred.')
    }
  }

  const handleMarkAbsent = async (sessionId: string) => {
    if (!absenceReason) {
      toast.error('Please select a reason for absence.')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('training_sessions')
        .update({ 
          status: 'absent',
          absence_reason: absenceReason
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Error marking absent:', error)
        toast.error('Error marking absent. Please try again.')
      } else {
        setShowAbsenceForm(null)
        setAbsenceReason('')
        toast.success('Session marked as absent.')
        fetchSessions()
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred.')
    }
  }

  const handleCancelSession = async (sessionId: string) => {
    const confirmed = await confirm({
      title: 'Cancel Session',
      description: 'Are you sure you want to cancel this training session?',
      confirmText: 'Cancel Session',
      cancelText: 'Keep Session',
      variant: 'danger'
    })
    if (!confirmed) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('training_sessions')
        .update({ status: 'cancelled' })
        .eq('id', sessionId)

      if (error) {
        console.error('Error cancelling session:', error)
        toast.error('Error cancelling session. Please try again.')
      } else {
        toast.success('Session cancelled successfully.')
        fetchSessions()
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred.')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Play className="h-5 w-5 text-blue-500" />
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const canStartSession = (session: TrainingSession) => {
    const now = new Date()
    const sessionDate = new Date(`${session.scheduled_date}T${session.start_time}`)
    const oneHourBefore = new Date(sessionDate.getTime() - 60 * 60 * 1000)
    
    return session.status === 'scheduled' && now >= oneHourBefore && now <= sessionDate
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SessionCardSkeleton />
        <SessionCardSkeleton />
        <SessionCardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Training Sessions</h1>
        <p className="mt-2 text-base text-gray-600">
          Manage your training sessions and track your progress
        </p>
      </div>

      {/* Sessions List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            All Sessions
          </h3>
          {sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(session.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(session.scheduled_date)}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeInTimezone(new Date(`2000-01-01T${session.start_time}`), userTimezone)} - {formatTimeInTimezone(new Date(`2000-01-01T${session.end_time}`), userTimezone)}</span>
                        </div>
                        {session.absence_reason && (
                          <p className="text-xs text-red-600 mt-1">
                            Absence reason: {session.absence_reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {session.session_type}
                      </span>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {session.status === 'scheduled' && canStartSession(session) && (
                          <Button
                            size="sm"
                            onClick={() => handleStartSession(session.id)}
                            leftIcon={<Play className="h-3 w-3" />}
                          >
                            Start
                          </Button>
                        )}

                        {session.status === 'scheduled' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowAbsenceForm(session.id)}
                              leftIcon={<AlertCircle className="h-3 w-3" />}
                              className="border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                            >
                              Absent
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelSession(session.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}

                        {session.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => router.push(`/dashboard/athlete/sessions/${session.id}`)}
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Absence Form */}
                  {showAbsenceForm === session.id && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800 mb-2">
                        Mark as Absent
                      </h4>
                      <div className="space-y-3">
                        <select
                          value={absenceReason}
                          onChange={(e) => setAbsenceReason(e.target.value)}
                          className="block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="">Select reason for absence</option>
                          {ABSENCE_REASONS.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </select>
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setShowAbsenceForm(null)
                              setAbsenceReason('')
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleMarkAbsent(session.id)}
                          >
                            Mark Absent
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Set up your training schedule to automatically generate sessions.
              </p>
              <Button
                onClick={() => router.push('/dashboard/athlete/schedule')}
                leftIcon={<Calendar className="w-4 h-4" />}
              >
                Set Up Schedule
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}




