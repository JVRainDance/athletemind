'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { Calendar, Target, TrendingUp, Clock, CheckCircle, Plus, X, Star, Rocket, BarChart3 } from 'lucide-react'
import { getFullName } from '@/lib/utils'
import { formatTimeInTimezone } from '@/lib/timezone-utils'
import AbsenceButton from '@/components/AbsenceButton'
import ExtraSessionButton from '@/components/ExtraSessionButton'
import SessionCountdown from '@/components/SessionCountdown'
import SessionButton from '@/components/SessionButton'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import DashboardStats from '@/components/DashboardStats'

interface TrainingSession {
  id: string
  scheduled_date: string
  start_time: string
  end_time: string
  session_type: 'regular' | 'competition' | 'extra'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'absent'
}

interface Checkin {
  id: string
  session_id: string
  energy_level: number
  mindset_level: number
  reward_criteria: string | null
  reward_earned: boolean | null
}

export default function AthleteDashboard() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [nextSession, setNextSession] = useState<TrainingSession | null>(null)
  const [nextSessionCheckin, setNextSessionCheckin] = useState<Checkin | null>(null)
  const [nextReward, setNextReward] = useState<any>(null)
  const [totalStars, setTotalStars] = useState(0)
  const [userTimezone, setUserTimezone] = useState('UTC')
  const [loading, setLoading] = useState(true)
  const [checkinCountdown, setCheckinCountdown] = useState<string>('')
  const [currentStreak, setCurrentStreak] = useState(0)
  const [completionRate, setCompletionRate] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()

    // Listen for session creation events to refresh data
    const handleSessionCreated = () => {
      fetchDashboardData()
    }

    window.addEventListener('sessionCreated', handleSessionCreated)

    return () => {
      window.removeEventListener('sessionCreated', handleSessionCreated)
    }
  }, [])

  // Update checkin countdown every minute
  useEffect(() => {
    if (!nextSession || nextSessionCheckin) {
      setCheckinCountdown('')
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const [year, month, day] = nextSession.scheduled_date.split('-').map(Number)
      const [startHour, startMin] = nextSession.start_time.split(':').map(Number)
      const sessionStart = new Date(year, month - 1, day, startHour, startMin)
      const checkinAvailableTime = new Date(sessionStart.getTime() - (60 * 60 * 1000)) // 1 hour before

      if (now < checkinAvailableTime) {
        const hoursUntil = Math.floor((checkinAvailableTime.getTime() - now.getTime()) / (1000 * 60 * 60))
        const minutesUntil = Math.floor(((checkinAvailableTime.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60))
        setCheckinCountdown(`${hoursUntil > 0 ? `${hoursUntil}h ` : ''}${minutesUntil}m`)
      } else {
        setCheckinCountdown('')
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [nextSession, nextSessionCheckin])

  const fetchDashboardData = async () => {
    try {
      console.log('Starting dashboard data fetch...')
      console.log('Supabase client:', supabase)

      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) {
        console.log('No auth session found, redirecting to login')
        router.push('/auth/login')
        return
      }

      console.log('Auth session found:', authSession.user.id)
      setSession(authSession)

      const now = new Date()
      const today = now.toISOString().split('T')[0]

      // OPTIMIZED: Parallel queries instead of sequential
      const [profileResult, nextSessionResult, rewardsResult, starsResult, sessionsResult] = await Promise.all([
        // Query 1: Profile data (only needed fields)
        supabase
          .from('profiles')
          .select('role, first_name, last_name, setup_completed, timezone, timezone_auto_detected')
          .eq('id', authSession.user.id)
          .maybeSingle(),

        // Query 2: Next session (without join - will fetch checkin separately)
        supabase
          .from('training_sessions')
          .select('id, scheduled_date, start_time, end_time, session_type, status')
          .eq('athlete_id', authSession.user.id)
          .in('status', ['scheduled', 'in_progress'])
          .gte('scheduled_date', today)
          .order('scheduled_date', { ascending: true })
          .limit(1)
          .maybeSingle(),

        // Query 3: Active rewards (only needed fields)
        supabase
          .from('rewards')
          .select('reward_name, reward_description, stars_required')
          .eq('user_id', authSession.user.id)
          .eq('is_active', true)
          .eq('reward_type', 'individual')
          .order('stars_required', { ascending: true }),

        // Query 4: Total stars (only sum the field we need)
        supabase
          .from('user_stars')
          .select('stars_earned')
          .eq('user_id', authSession.user.id),

        // Query 5: All sessions for stats calculation
        supabase
          .from('training_sessions')
          .select('id, scheduled_date, status')
          .eq('athlete_id', authSession.user.id)
          .order('scheduled_date', { ascending: false })
      ])

      // Handle profile
      const { data: profileData, error: profileError } = profileResult
      if (profileError) {
        console.error('Error fetching profile:', profileError)
        router.push('/auth/login')
        return
      }

      if (!profileData) {
        console.error('No profile found for user')
        router.push('/auth/login')
        return
      }

      if (profileData.role !== 'athlete') {
        router.push('/auth/login')
        return
      }

      // Redirect to setup if not completed
      if (!profileData.setup_completed) {
        router.push('/dashboard/athlete/setup')
        return
      }

      setProfile(profileData)
      setUserTimezone(profileData.timezone || 'UTC')

      // Handle next session
      const { data: nextSessionData, error: nextSessionError } = nextSessionResult
      if (nextSessionError) {
        console.error('Error fetching next session:', nextSessionError)
        setNextSession(null)
      } else if (nextSessionData) {
        console.log('Next session found:', nextSessionData)
        setNextSession(nextSessionData)

        // Fetch checkin separately if session exists
        const { data: checkinData } = await supabase
          .from('pre_training_checkins')
          .select('*')
          .eq('session_id', nextSessionData.id)
          .maybeSingle()

        if (checkinData) {
          setNextSessionCheckin(checkinData)
        }
      }

      // Handle rewards
      const { data: rewards } = rewardsResult
      const { data: userStars } = starsResult

      // Calculate total stars
      const totalStarsEarned = userStars?.reduce((sum, star) => sum + star.stars_earned, 0) || 0
      setTotalStars(totalStarsEarned)

      // Find next reward (first one not yet achieved)
      if (rewards && rewards.length > 0) {
        const nextRewardData = rewards.find(reward => reward.stars_required > totalStarsEarned) || rewards[0]
        setNextReward(nextRewardData)
      }

      // Calculate stats from sessions
      const { data: sessions } = sessionsResult
      if (sessions && sessions.length > 0) {
        // Total sessions
        setTotalSessions(sessions.length)

        // Completion rate (completed sessions / total past sessions)
        const pastSessions = sessions.filter(s => new Date(s.scheduled_date) < now)
        const completedSessions = pastSessions.filter(s => s.status === 'completed')
        const rate = pastSessions.length > 0 ? Math.round((completedSessions.length / pastSessions.length) * 100) : 0
        setCompletionRate(rate)

        // Current streak (consecutive days with completed sessions)
        let streak = 0
        const sortedSessions = [...sessions].sort((a, b) =>
          new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
        )

        const completedDates = sortedSessions
          .filter(s => s.status === 'completed')
          .map(s => s.scheduled_date)

        if (completedDates.length > 0) {
          const mostRecentDate = new Date(completedDates[0])
          const todayDate = new Date(today)
          const daysDiff = Math.floor((todayDate.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24))

          // Only count streak if most recent completion was today or yesterday
          if (daysDiff <= 1) {
            let currentDate = new Date(completedDates[0])
            for (let i = 0; i < completedDates.length; i++) {
              const sessionDate = new Date(completedDates[i])
              const diff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))

              if (diff <= 1) {
                streak++
                currentDate = sessionDate
              } else {
                break
              }
            }
          }
        }

        setCurrentStreak(streak)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-base text-gray-600">
          Ready to show up, reflect, and build momentum.
        </p>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats
        totalStars={totalStars}
        currentStreak={currentStreak}
        completionRate={completionRate}
        totalSessions={totalSessions}
      />

      {/* Next Training Session Card */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6 text-center">
          <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Your next available training is...
          </h2>
          {nextSession ? (
            <div className="space-y-4">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {new Date(nextSession.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-base sm:text-lg text-primary-600 font-medium">
                  {formatTimeInTimezone(new Date(`2000-01-01T${nextSession.start_time}`), userTimezone)} - {formatTimeInTimezone(new Date(`2000-01-01T${nextSession.end_time}`), userTimezone)}
                </p>
              </div>
              
              {/* Countdown Timer */}
              <div className="flex justify-center">
                <SessionCountdown
                  sessionDate={nextSession.scheduled_date}
                  sessionTime={nextSession.start_time}
                />
              </div>

              {/* Check-in Availability Message */}
              {checkinCountdown && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    Check-in will be available in {checkinCountdown} (1 hour before session start)
                  </p>
                </div>
              )}

              <SessionButton
                session={nextSession}
                checkin={nextSessionCheckin}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Sessions</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                You don't have any training sessions scheduled yet. Create your first training schedule to get started.
              </p>
              <Link
                href="/dashboard/athlete/schedule"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Schedule
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Training Actions Card */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Actions</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <AbsenceButton athleteId={session.user.id} />
            <ExtraSessionButton athleteId={session.user.id} />
            <Link
              href="/dashboard/athlete/progress"
              className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Progress
            </Link>
          </div>
        </div>
      </div>

      {/* Rewards Card - Only show if user has rewards set up */}
      {nextReward && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 shadow-sm rounded-lg border-2 border-yellow-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Next Reward</h2>
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-sm">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xl font-bold text-gray-900">{nextReward.reward_name}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Progress</span>
                  <span className="font-semibold text-gray-900">{totalStars} / {nextReward.stars_required} stars</span>
                </div>
                <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min((totalStars / nextReward.stars_required) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-700">
                {nextReward.stars_required - totalStars > 0
                  ? `${nextReward.stars_required - totalStars} more stars to unlock this reward!`
                  : 'Reward unlocked! Claim it now.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Card */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/athlete/goals"
              className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                <Target className="w-6 h-6 text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-base">Set Training Goals</p>
                <p className="text-sm text-gray-600 mt-0.5">Plan objectives for upcoming sessions</p>
              </div>
            </Link>
            <Link
              href="/dashboard/athlete/progress"
              className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-base">View Progress</p>
                <p className="text-sm text-gray-600 mt-0.5">Review your training journey and achievements</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}