'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { TrendingUp, Target, Calendar, Award, BarChart3 } from 'lucide-react'

interface ProgressStats {
  totalSessions: number
  completedSessions: number
  completionRate: number
  currentStreak: number
  longestStreak: number
  totalGoals: number
  achievedGoals: number
  goalAchievementRate: number
  averageRating: number
}

interface RecentSession {
  id: string
  scheduled_date: string
  overall_rating: number
  goals_achieved: number
  total_goals: number
}

export default function ProgressPage() {
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchProgressData()
  }, [])

  const fetchProgressData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Fetch all sessions
      const { data: allSessions } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('athlete_id', session.user.id)
        .in('status', ['completed', 'absent'])
        .order('scheduled_date', { ascending: false })

      // Fetch all goals
      const { data: allGoals } = await supabase
        .from('session_goals')
        .select(`
          *,
          training_sessions!inner(athlete_id, status)
        `)
        .eq('training_sessions.athlete_id', session.user.id)
        .eq('training_sessions.status', 'completed')

      // Fetch reflections with ratings
      const { data: reflections } = await supabase
        .from('session_reflections')
        .select(`
          overall_rating,
          training_sessions!inner(athlete_id, status, scheduled_date)
        `)
        .eq('training_sessions.athlete_id', session.user.id)
        .eq('training_sessions.status', 'completed')
        .order('training_sessions.scheduled_date', { ascending: false })

      // Calculate stats
      const totalSessions = allSessions?.length || 0
      const completedSessions = allSessions?.filter(s => s.status === 'completed').length || 0
      const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

      // Calculate streaks
      const completedDates = allSessions
        ?.filter(s => s.status === 'completed')
        .map(s => new Date(s.scheduled_date).toDateString())
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) || []

      const { currentStreak, longestStreak } = calculateStreaks(completedDates)

      // Calculate goal stats
      const totalGoals = allGoals?.length || 0
      const achievedGoals = allGoals?.filter(g => g.achieved === true).length || 0
      const goalAchievementRate = totalGoals > 0 ? Math.round((achievedGoals / totalGoals) * 100) : 0

      // Calculate average rating
      const ratings = reflections?.map(r => r.overall_rating) || []
      const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0

      setStats({
        totalSessions,
        completedSessions,
        completionRate,
        currentStreak,
        longestStreak,
        totalGoals,
        achievedGoals,
        goalAchievementRate,
        averageRating: Math.round(averageRating * 10) / 10
      })

      // Fetch recent sessions with goal data
      const { data: recentSessionsData } = await supabase
        .from('training_sessions')
        .select(`
          id,
          scheduled_date,
          session_reflections(overall_rating),
          session_goals(achieved)
        `)
        .eq('athlete_id', session.user.id)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: false })
        .limit(10)

      const processedRecentSessions = recentSessionsData?.map(session => ({
        id: session.id,
        scheduled_date: session.scheduled_date,
        overall_rating: session.session_reflections?.[0]?.overall_rating || 0,
        goals_achieved: session.session_goals?.filter((g: any) => g.achieved === true).length || 0,
        total_goals: session.session_goals?.length || 0
      })) || []

      setRecentSessions(processedRecentSessions)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStreaks = (completedDates: string[]) => {
    if (completedDates.length === 0) return { currentStreak: 0, longestStreak: 0 }

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 1

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Check current streak
    for (let i = 0; i < completedDates.length; i++) {
      const date = new Date(completedDates[i])
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)

      if (date.toDateString() === expectedDate.toDateString()) {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate longest streak
    for (let i = 1; i < completedDates.length; i++) {
      const currentDate = new Date(completedDates[i])
      const previousDate = new Date(completedDates[i - 1])
      const dayDiff = (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)

      if (dayDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    return { currentStreak, longestStreak }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-600">Unable to load progress data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
        <p className="mt-2 text-gray-600">
          Track your training journey and celebrate your achievements
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-primary-600" />
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
                <Award className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Current Streak
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.currentStreak} days
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
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Goal Achievement
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.goalAchievementRate}%
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
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Rating
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.averageRating}/5
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Stats */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Sessions</span>
              <span className="text-sm font-medium text-gray-900">{stats.totalSessions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed Sessions</span>
              <span className="text-sm font-medium text-gray-900">{stats.completedSessions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Longest Streak</span>
              <span className="text-sm font-medium text-gray-900">{stats.longestStreak} days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              {stats.completionRate}% completion rate
            </p>
          </div>
        </div>

        {/* Goal Stats */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Goal Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Goals Set</span>
              <span className="text-sm font-medium text-gray-900">{stats.totalGoals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Goals Achieved</span>
              <span className="text-sm font-medium text-gray-900">{stats.achievedGoals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Achievement Rate</span>
              <span className="text-sm font-medium text-gray-900">{stats.goalAchievementRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${stats.goalAchievementRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              {stats.goalAchievementRate}% goal achievement rate
            </p>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Training Sessions</h3>
        </div>
        <div className="px-6 py-4">
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(session.scheduled_date)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Goals: {session.goals_achieved}/{session.total_goals} achieved
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${
                            i < session.overall_rating ? 'bg-yellow-400' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {session.overall_rating}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No completed sessions yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Complete your first training session to start tracking your progress.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
