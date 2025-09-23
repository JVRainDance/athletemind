'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'
import { Flame, Star, Gift, Target, BarChart3, Calendar, ArrowRight, Sparkles } from 'lucide-react'
import BackButton from '@/components/BackButton'

type Session = Database['public']['Tables']['training_sessions']['Row']
type Goal = Database['public']['Tables']['session_goals']['Row']
type UserStar = Database['public']['Tables']['user_stars']['Row']
type Reward = Database['public']['Tables']['rewards']['Row']

export default function AthleteProgressPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [stats, setStats] = useState({
    currentStreak: 0,
    totalStars: 0,
    goalCompletion: 0,
    weeklyConsistency: 0,
    recentSessions: [] as Session[]
  })
  const [rewards, setRewards] = useState<Reward[]>([])
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    loadProgressData()
    
    // Check if this is from a completed session
    const fromSession = searchParams.get('fromSession')
    if (fromSession === 'true') {
      setShowCelebration(true)
    }
  }, [searchParams, loadProgressData])

  const loadProgressData = useCallback(async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) {
        router.push('/auth/login')
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', authSession.user.id)
        .single()

      if (profile) {
        setUserName(profile.first_name || 'Athlete')
      }

      // Get completed sessions for streak calculation
      const { data: completedSessions } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('athlete_id', authSession.user.id)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: false })
        .limit(50) // Limit to last 50 sessions for performance

      // Calculate current streak
      const currentStreak = calculateStreak(completedSessions || [])

      // Get total stars earned
      const { data: userStars } = await supabase
        .from('user_stars')
        .select('stars_earned')
        .eq('user_id', authSession.user.id)

      const totalStars = userStars?.reduce((sum, star) => sum + star.stars_earned, 0) || 0

      // Get recent sessions (last 6)
      const recentSessions = (completedSessions || []).slice(0, 6)

      // Calculate weekly consistency (last 4 weeks)
      const weeklyConsistency = await calculateWeeklyConsistency(authSession.user.id)

      // Get goal completion rate for this week
      const goalCompletion = await calculateGoalCompletion(authSession.user.id)

      // Get rewards
      const { data: userRewards } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', authSession.user.id)
        .eq('is_active', true)
        .eq('reward_type', 'individual')

      console.log('Progress data loaded:', {
        currentStreak,
        totalStars,
        goalCompletion,
        weeklyConsistency,
        recentSessionsCount: recentSessions.length,
        rewardsCount: userRewards?.length || 0
      })

      setStats({
        currentStreak: currentStreak || 0,
        totalStars: totalStars || 0,
        goalCompletion: goalCompletion || 0,
        weeklyConsistency: weeklyConsistency || 0,
        recentSessions: recentSessions || []
      })
      setRewards(userRewards || [])

    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  const calculateStreak = (sessions: Session[]) => {
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
        if (daysDiff <= 1) {
          streak = 1
        } else {
          break
        }
      } else {
        // Check if this session is consecutive to the previous one
        const prevSessionDate = new Date(sortedSessions[i-1].scheduled_date)
        prevSessionDate.setHours(0, 0, 0, 0)
        const daysBetween = Math.floor((prevSessionDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysBetween === 1) {
          streak++
      } else {
        break
      }
    }
    }
    
    return streak
  }

  const calculateWeeklyConsistency = async (userId: string) => {
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    
    // Get all sessions (scheduled and completed) from the last 4 weeks
    const { data: allSessions } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('athlete_id', userId)
      .gte('scheduled_date', fourWeeksAgo.toISOString())
      .order('scheduled_date', { ascending: true })
    
    if (!allSessions || allSessions.length === 0) return 0
    
    const completedSessions = allSessions.filter(session => session.status === 'completed')
    return Math.round((completedSessions.length / allSessions.length) * 100)
  }

  const calculateGoalCompletion = async (userId: string) => {
    // Get goals from this week's completed sessions
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    // First get completed sessions from this week
    const { data: recentSessions } = await supabase
      .from('training_sessions')
      .select('id')
      .eq('athlete_id', userId)
      .eq('status', 'completed')
      .gte('scheduled_date', oneWeekAgo.toISOString())
    
    if (!recentSessions || recentSessions.length === 0) return 0
    
    const sessionIds = recentSessions.map(session => session.id)
    
    // Get goals for these sessions
    const { data: recentGoals } = await supabase
      .from('session_goals')
      .select('achieved')
      .in('session_id', sessionIds)
    
    if (!recentGoals || recentGoals.length === 0) return 0
    
    const achievedGoals = recentGoals.filter(goal => goal.achieved === true).length
    return Math.round((achievedGoals / recentGoals.length) * 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getNextReward = () => {
    if (rewards.length === 0) return null
    
    // Find the reward with the highest stars_required that hasn't been achieved
    const sortedRewards = rewards.sort((a, b) => a.stars_required - b.stars_required)
    return sortedRewards.find(reward => reward.stars_required > stats.totalStars) || sortedRewards[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your progress...</p>
        </div>
      </div>
    )
  }

  const nextReward = getNextReward()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton href="/dashboard/athlete" />
      </div>

        {/* Header */}
        <div className="text-center mb-8">
          {showCelebration ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-yellow-500 mr-2" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Awesome Work Today!
                </h1>
              </div>
              <p className="text-lg text-gray-600">
                Here&apos;s how you&apos;re progressing, {userName}
              </p>
              </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Your Progress
              </h1>
              <p className="text-lg text-gray-600">
                Keep up the great work, {userName}!
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Current Streak */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Flame className="h-6 w-6 text-orange-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Current Streak</h3>
              </div>
            <div className="text-3xl font-bold text-orange-500 mb-2">
              {stats.currentStreak} sessions
              </div>
            <p className="text-gray-600">In a row! Keep it going!</p>
        </div>

          {/* Total Stars */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Star className="h-6 w-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Total Stars Earned</h3>
              </div>
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {stats.totalStars} ⭐
              </div>
            <p className="text-gray-600">Amazing progress!</p>
        </div>

          {/* Next Reward Progress */}
          {nextReward && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Gift className="h-6 w-6 text-primary-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Next Reward Progress</h3>
              </div>
              <div className="text-xl font-semibold text-gray-900 mb-2">
                {nextReward.reward_name}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (stats.totalStars / nextReward.stars_required) * 100)}%` }}
                ></div>
            </div>
              <p className="text-gray-600">
                {nextReward.stars_required - stats.totalStars > 0 
                  ? `${nextReward.stars_required - stats.totalStars} more stars to go!`
                  : 'Reward unlocked!'
                }
              </p>
          </div>
          )}

          {/* Goal Completion */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Target className="h-6 w-6 text-green-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Goal Completion</h3>
            </div>
            <div className="text-3xl font-bold text-green-500 mb-2">
              {stats.goalCompletion}%
            </div>
            <p className="text-gray-600">completed this week</p>
          </div>
        </div>

        {/* Weekly Consistency */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-6 w-6 text-primary-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Last 4 Weeks Consistency</h3>
            </div>
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {Math.round(stats.weeklyConsistency)}%
            </div>
          <p className="text-gray-600 mb-4">of scheduled sessions logged.</p>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-primary-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${stats.weeklyConsistency}%` }}
            ></div>
            </div>
          <p className="text-gray-600 mt-2">
            {stats.weeklyConsistency >= 90 
              ? 'Excellent consistency! Keep up the great work.'
              : 'Good progress! Try to maintain consistency.'
            }
          </p>
      </div>

      {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center mb-4">
            <Calendar className="h-6 w-6 text-primary-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
        </div>
            <div className="space-y-3">
            {stats.recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-900 font-medium">
                      {formatDate(session.scheduled_date)}
                  </span>
                  </div>
                <div className="flex items-center text-gray-600">
                  <span className="mr-2">Completed</span>
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-primary-600 cursor-pointer hover:underline">
                    Click to view
                    </span>
                  </div>
                </div>
              ))}
            </div>
        </div>

        {/* Encouragement Message */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-xl font-semibold text-gray-900">
                You&apos;re doing amazing, {userName}!
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Your dedication and consistency are paying off. Keep pushing towards your goals!
            </p>
            {stats.currentStreak >= 10 && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                <Flame className="h-4 w-4 mr-1" />
                Streak Champion!
            </div>
          )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/dashboard/athlete')}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Continue to Dashboard
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  )
}