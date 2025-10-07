'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'
import { ArrowLeft, Calendar, Target, TrendingUp, CheckCircle, Clock, Star, BarChart3 } from 'lucide-react'
import { getFullName } from '@/lib/utils'
import BackButton from '@/components/BackButton'

type Profile = Database['public']['Tables']['profiles']['Row']
type TrainingSession = Database['public']['Tables']['training_sessions']['Row']
type SessionGoal = Database['public']['Tables']['session_goals']['Row']
type PreTrainingCheckin = Database['public']['Tables']['pre_training_checkins']['Row']
type SessionReflection = Database['public']['Tables']['session_reflections']['Row']

export default function AthleteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [athlete, setAthlete] = useState<Profile | null>(null)
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    completionRate: 0,
    currentStreak: 0,
    totalStars: 0
  })

  useEffect(() => {
    if (params.id) {
      loadAthleteData(params.id as string)
    }
  }, [params.id])

  const loadAthleteData = async (athleteId: string) => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) {
        router.push('/auth/login')
        return
      }

      // Verify coach has access to this athlete
      const { data: coachAthlete } = await supabase
        .from('coach_athletes')
        .select('*')
        .eq('coach_id', authSession.user.id)
        .eq('athlete_id', athleteId)
        .eq('is_active', true)
        .single()

      if (!coachAthlete) {
        router.push('/dashboard/coach')
        return
      }

      // Get athlete profile
      const { data: athleteProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', athleteId)
        .single()

      if (!athleteProfile) {
        router.push('/dashboard/coach')
        return
      }

      setAthlete(athleteProfile)

      // Get athlete's sessions
      const { data: athleteSessions } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('scheduled_date', { ascending: false })
        .limit(20)

      setSessions(athleteSessions || [])

      // Calculate stats
      const totalSessions = athleteSessions?.length || 0
      const completedSessions = athleteSessions?.filter(s => s.status === 'completed').length || 0
      const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

      // Calculate current streak
      const currentStreak = calculateStreak(athleteSessions || [])

      // Get total stars
      const { data: userStars } = await supabase
        .from('user_stars')
        .select('stars_earned')
        .eq('user_id', athleteId)

      const totalStars = userStars?.reduce((sum, star) => sum + star.stars_earned, 0) || 0

      setStats({
        totalSessions,
        completedSessions,
        completionRate,
        currentStreak,
        totalStars
      })

    } catch (error) {
      console.error('Error loading athlete data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStreak = (sessions: TrainingSession[]) => {
    if (sessions.length === 0) return 0
    
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Sort sessions by date (most recent first)
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
    )
    
    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].scheduled_date)
      sessionDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (i === 0) {
        // First session - check if it's today or yesterday
        if (daysDiff <= 1 && sortedSessions[i].status === 'completed') {
          streak = 1
        } else {
          break
        }
      } else {
        // Check if this session is consecutive to the previous one
        const prevSessionDate = new Date(sortedSessions[i-1].scheduled_date)
        prevSessionDate.setHours(0, 0, 0, 0)
        const daysBetween = Math.floor((prevSessionDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysBetween === 1 && sortedSessions[i].status === 'completed') {
          streak++
        } else {
          break
        }
      }
    }
    
    return streak
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading athlete details...</p>
        </div>
      </div>
    )
  }

  if (!athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Athlete not found</h2>
          <p className="mt-2 text-gray-600">This athlete may not be assigned to you.</p>
          <button
            onClick={() => router.push('/dashboard/coach')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <BackButton href="/dashboard/coach" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getFullName(athlete.first_name, athlete.last_name)}
          </h1>
          <p className="mt-1 text-gray-600">{athlete.email}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Sessions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalSessions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.completedSessions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completion Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.completionRate}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Current Streak
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.currentStreak}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Training Sessions
          </h3>
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(session.scheduled_date)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(`2000-01-01T${session.start_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })} - {new Date(`2000-01-01T${session.end_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status || 'scheduled')}`}>
                      {session.status}
                    </span>
                    {session.absence_reason && (
                      <span className="text-xs text-gray-500">
                        Reason: {session.absence_reason}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                This athlete hasn&apos;t had any training sessions scheduled.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
