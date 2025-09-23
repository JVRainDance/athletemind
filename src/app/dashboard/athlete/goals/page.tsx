'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { formatDate } from '@/lib/utils'
import { Plus, Target, Calendar, Clock } from 'lucide-react'
import BackButton from '@/components/BackButton'

interface UpcomingSession {
  id: string
  scheduled_date: string
  start_time: string
  end_time: string
  session_type: string
  goals: Array<{
    id: string
    goal_text: string
  }>
}

export default function GoalsPage() {
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddGoal, setShowAddGoal] = useState<string | null>(null)
  const [newGoal, setNewGoal] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchUpcomingSessions()
  }, [fetchUpcomingSessions])

  const fetchUpcomingSessions = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Get sessions for the next 7 days
      const today = new Date().toISOString().split('T')[0]
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const nextWeekStr = nextWeek.toISOString().split('T')[0]

      const { data: sessions, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('athlete_id', session.user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_date', today)
        .lte('scheduled_date', nextWeekStr)
        .order('scheduled_date')

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError)
        return
      }

      // Fetch goals for each session
      const sessionsWithGoals = await Promise.all(
        (sessions || []).map(async (session) => {
          const { data: goals } = await supabase
            .from('session_goals')
            .select('id, goal_text')
            .eq('session_id', session.id)
            .order('created_at')

          return {
            ...session,
            goals: goals || []
          }
        })
      )

      setUpcomingSessions(sessionsWithGoals)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleAddGoal = async (sessionId: string) => {
    if (!newGoal.trim()) {
      alert('Please enter a goal.')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('session_goals')
        .insert({
          session_id: sessionId,
          goal_text: newGoal.trim()
        })

      if (error) {
        console.error('Error adding goal:', error)
        alert('Error adding goal. Please try again.')
      } else {
        setNewGoal('')
        setShowAddGoal(null)
        fetchUpcomingSessions()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred.')
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('session_goals')
        .delete()
        .eq('id', goalId)

      if (error) {
        console.error('Error deleting goal:', error)
        alert('Error deleting goal. Please try again.')
      } else {
        fetchUpcomingSessions()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred.')
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
      <div className="flex items-center space-x-4">
        <BackButton href="/dashboard/athlete" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training Goals</h1>
          <p className="mt-2 text-gray-600">
            Set goals for your upcoming training sessions (up to 7 days in advance)
          </p>
        </div>
      </div>

      {upcomingSessions.length > 0 ? (
        <div className="space-y-6">
          {upcomingSessions.map((session) => (
            <div key={session.id} className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {formatDate(session.scheduled_date)}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{session.start_time} - {session.end_time}</span>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {session.session_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {session.goals.length}/3 goals
                    </span>
                    <button
                      onClick={() => setShowAddGoal(showAddGoal === session.id ? null : session.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Goal
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                {/* Add Goal Form */}
                {showAddGoal === session.id && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Goal
                        </label>
                        <input
                          type="text"
                          value={newGoal}
                          onChange={(e) => setNewGoal(e.target.value)}
                          placeholder="What do you want to achieve in this session?"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setShowAddGoal(null)
                            setNewGoal('')
                          }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddGoal(session.id)}
                          className="px-3 py-1 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded"
                        >
                          Add Goal
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Goals List */}
                {session.goals.length > 0 ? (
                  <div className="space-y-3">
                    {session.goals.map((goal, index) => (
                      <div key={goal.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                        </div>
                        <p className="flex-1 text-sm text-gray-700">{goal.goal_text}</p>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Target className="mx-auto h-8 w-8 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No goals set</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Add your first goal for this session to get started.
                    </p>
                  </div>
                )}

                {/* Goal Progress Indicator */}
                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3].map((num) => (
                      <div
                        key={num}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          num <= session.goals.length
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {session.goals.length === 0 && 'Set at least 1 goal to get started'}
                    {session.goals.length === 1 && 'Great start! Consider adding 1-2 more goals'}
                    {session.goals.length === 2 && 'Almost there! One more goal would be perfect'}
                    {session.goals.length === 3 && 'Perfect! You have all 3 goals set'}
                    {session.goals.length > 3 && 'You have more than 3 goals - consider focusing on the most important ones'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming sessions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Set up your training schedule to start setting goals for upcoming sessions.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard/athlete/schedule')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Set Up Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



