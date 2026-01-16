'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'
import { Flame, Star, Gift, Target, BarChart3, Calendar, ArrowRight, Sparkles } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { ProgressSkeleton } from '@/components/skeletons/progress-skeleton'

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

  useEffect(() => {
    loadProgressData()
    
    // Check if this is from a completed session
    const fromSession = searchParams.get('fromSession')
    if (fromSession === 'true') {
      setShowCelebration(true)
    }
  }, [searchParams, loadProgressData])

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

  // Generate dynamic motivational message based on progress
  const getMotivationalMessage = () => {
    const { currentStreak, totalStars, goalCompletion, weeklyConsistency } = stats

    // Excellent performance
    if (currentStreak >= 7 && goalCompletion >= 80) {
      return {
        title: `Outstanding, ${userName}!`,
        message: `You're on a ${currentStreak}-session streak with ${goalCompletion}% goal completion. You're absolutely crushing it!`,
        emoji: '🔥'
      }
    }

    // Great streak
    if (currentStreak >= 5) {
      return {
        title: `Incredible Momentum, ${userName}!`,
        message: `${currentStreak} sessions in a row! Your consistency is building real results.`,
        emoji: '💪'
      }
    }

    // Good goal completion but no streak
    if (goalCompletion >= 75) {
      return {
        title: `Excellent Focus, ${userName}!`,
        message: `${goalCompletion}% of your goals achieved. Your dedication to your objectives is impressive!`,
        emoji: '🎯'
      }
    }

    // Has some stars but needs improvement
    if (totalStars > 0 && currentStreak < 3) {
      return {
        title: `Keep Building, ${userName}!`,
        message: `You've earned ${totalStars} stars. Stay consistent to unlock even more progress!`,
        emoji: '⭐'
      }
    }

    // Just starting or struggling
    if (totalStars === 0 || stats.recentSessions.length === 0) {
      return {
        title: `Let's Get Started, ${userName}!`,
        message: `Your journey begins now. Complete your first session to start building momentum!`,
        emoji: '🚀'
      }
    }

    // Default encouraging message
    return {
      title: `Great Progress, ${userName}!`,
      message: `You're on your way! Every session brings you closer to your goals.`,
      emoji: '💫'
    }
  }

  if (loading) {
    return <ProgressSkeleton />
  }

  const nextReward = getNextReward()
  const motivation = getMotivationalMessage()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
        <p className="mt-2 text-base text-gray-600">
          Track your journey and celebrate your achievements
        </p>
      </div>

      {/* Motivational Banner */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-sm p-6 text-white">
        <div className="flex items-start space-x-4">
          <div className="text-4xl">{motivation.emoji}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{motivation.title}</h2>
            <p className="text-primary-50 text-lg">{motivation.message}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Streak */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Current Streak</p>
              <Flame className={`h-5 w-5 ${stats.currentStreak >= 5 ? 'text-orange-500' : 'text-gray-400'}`} />
            </div>
            <div className="text-3xl font-bold text-orange-500">
              {stats.currentStreak}
            </div>
            <p className="text-sm text-gray-600">
              {stats.currentStreak === 0 ? 'Start your streak today!' :
               stats.currentStreak === 1 ? 'Great start! Keep going.' :
               stats.currentStreak < 5 ? 'Building momentum!' :
               stats.currentStreak < 10 ? 'On fire! 🔥' :
               'Unstoppable! 🔥🔥'}
            </p>
          </div>
        </div>

        {/* Total Stars */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Stars</p>
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.totalStars}
            </div>
            <p className="text-sm text-gray-600">
              {stats.totalStars === 0 ? 'Earn your first star!' :
               stats.totalStars < 10 ? 'Off to a great start!' :
               stats.totalStars < 50 ? 'Building your collection!' :
               stats.totalStars < 100 ? 'Impressive progress!' :
               'Star collector! ⭐'}
            </p>
          </div>
        </div>

        {/* Goal Completion */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Goal Rate</p>
              <Target className={`h-5 w-5 ${stats.goalCompletion >= 75 ? 'text-green-500' : 'text-gray-400'}`} />
            </div>
            <div className="text-3xl font-bold text-green-600">
              {stats.goalCompletion}%
            </div>
            <p className="text-sm text-gray-600">
              {stats.goalCompletion === 0 ? 'Set your first goal!' :
               stats.goalCompletion < 50 ? 'Room to improve' :
               stats.goalCompletion < 75 ? 'Getting there!' :
               stats.goalCompletion < 90 ? 'Excellent focus! 🎯' :
               'Precision! 🎯🎯'}
            </p>
          </div>
        </div>

        {/* Weekly Consistency */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Consistency</p>
              <BarChart3 className={`h-5 w-5 ${stats.weeklyConsistency >= 80 ? 'text-primary-500' : 'text-gray-400'}`} />
            </div>
            <div className="text-3xl font-bold text-primary-600">
              {Math.round(stats.weeklyConsistency)}%
            </div>
            <p className="text-sm text-gray-600">
              {stats.weeklyConsistency === 0 ? 'Start building!' :
               stats.weeklyConsistency < 50 ? 'Keep showing up' :
               stats.weeklyConsistency < 75 ? 'Good consistency!' :
               stats.weeklyConsistency < 90 ? 'Very reliable! 💪' :
               'Rock solid! 💪💪'}
            </p>
          </div>
        </div>
      </div>

      {/* Next Reward Card */}
      {nextReward && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-sm border-2 border-yellow-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Next Reward</h3>
            <Gift className="h-6 w-6 text-yellow-600" />
          </div>
          <p className="text-xl font-bold text-gray-900 mb-4">{nextReward.reward_name}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Progress</span>
              <span className="font-semibold text-gray-900">
                {stats.totalStars} / {nextReward.stars_required} stars
              </span>
            </div>
            <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.totalStars / nextReward.stars_required) * 100)}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-gray-700 mt-4">
            {nextReward.stars_required - stats.totalStars > 0
              ? `${nextReward.stars_required - stats.totalStars} more stars to unlock!`
              : '🎉 Reward unlocked! Claim it on your dashboard.'}
          </p>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">Recent Sessions</h3>
        {stats.recentSessions.length > 0 ? (
          <div className="space-y-3">
            {stats.recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(session.scheduled_date)}
                    </p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/athlete/sessions/${session.id}/reflection`}
                  className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View details →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-600">No completed sessions yet</p>
            <p className="text-sm text-gray-500 mt-1">Complete your first session to see it here!</p>
          </div>
        )}
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
  )
}