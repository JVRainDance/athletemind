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
      const [profileResult, nextSessionResult, rewardsResult, starsResult] = await Promise.all([
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
          .eq('user_id', authSession.user.id)
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
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mt-2 text-gray-600">
          Ready to show up, reflect, and build momentum.
        </p>
      </div>

      {/* Next Training Session Card */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6 text-center">
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
              
              <SessionButton 
                session={nextSession} 
                checkin={nextSessionCheckin} 
              />
            </div>
          ) : (
            <p className="text-gray-500">No upcoming training sessions scheduled</p>
          )}
        </div>
      </div>

      {/* Training Actions Card */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Training Actions</h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <AbsenceButton athleteId={session.user.id} />
            <ExtraSessionButton athleteId={session.user.id} />
            <Link
              href="/dashboard/athlete/progress"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Progress
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <span className="text-sm text-gray-600">Theme:</span>
            <select className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option>Zelda</option>
              <option>Mario</option>
              <option>Pokemon</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rewards Card - Only show if user has rewards set up */}
      {nextReward && (
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-2 mb-4">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Your Next Reward</h2>
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-lg font-medium text-gray-900">{nextReward.reward_name}</p>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-yellow-400 h-3 rounded-full" 
                    style={{ width: `${Math.min((totalStars / nextReward.stars_required) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-gray-900">{totalStars}/{nextReward.stars_required}</span>
                  <Star className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Keep earning stars through your training sessions to reach your reward
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Card */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Would you like to...</h2>
          <div className="space-y-4">
            <Link
              href="/dashboard/athlete/goals"
              className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base">Set your daily training goals in advance?</p>
                <p className="text-xs sm:text-sm text-gray-600">Plan your objectives for upcoming sessions</p>
              </div>
            </Link>
            <Link
              href="/dashboard/athlete/progress"
              className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base">View your training journey so far?</p>
                <p className="text-xs sm:text-sm text-gray-600">Review your progress and achievements</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}