'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'
import { CheckCircle, Clock, Target, Star, ArrowRight } from 'lucide-react'
import BackButton from '@/components/BackButton'

type Session = Database['public']['Tables']['training_sessions']['Row']
type Goal = Database['public']['Tables']['session_goals']['Row']
type AdvanceGoal = Database['public']['Tables']['advance_goals']['Row']
type RatingTheme = Database['public']['Tables']['rating_themes']['Row']
type Reward = Database['public']['Tables']['rewards']['Row']

interface PageProps {
  params: {
    id: string
  }
}

export default function PreTrainingCheckinPage({ params }: PageProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [session, setSession] = useState<Session | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [advanceGoals, setAdvanceGoals] = useState<AdvanceGoal[]>([])
  const [ratingTheme, setRatingTheme] = useState<RatingTheme | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Form state
  const [formGoals, setFormGoals] = useState<string[]>(['', '', ''])
  const [energyLevel, setEnergyLevel] = useState<number>(0)
  const [mindsetLevel, setMindsetLevel] = useState<number>(0)
  const [rewardCriteria, setRewardCriteria] = useState<string>('')
  const [selectedReward, setSelectedReward] = useState<string>('')
  
  // Time validation
  const [canStartCheckin, setCanStartCheckin] = useState(false)
  const [timeUntilSession, setTimeUntilSession] = useState<string>('')

  useEffect(() => {
    // Check if we're within 1 hour of session start
    if (session) {
      const sessionDateTime = new Date(`${session.scheduled_date}T${session.start_time}`)
      const now = new Date()
      const timeDiff = sessionDateTime.getTime() - now.getTime()
      const hoursUntilSession = timeDiff / (1000 * 60 * 60)
      
      // Allow check-in if within 1 hour before session OR if session has started but not ended
      const sessionEnd = new Date(`${session.scheduled_date}T${session.end_time}`)
      const sessionEnded = now > sessionEnd
      setCanStartCheckin((hoursUntilSession <= 1 && hoursUntilSession >= -1) && !sessionEnded)
      
      if (hoursUntilSession > 0) {
        const hours = Math.floor(hoursUntilSession)
        const minutes = Math.floor((hoursUntilSession - hours) * 60)
        setTimeUntilSession(`${hours}h ${minutes}m until session`)
      } else if (hoursUntilSession >= -1) {
        setTimeUntilSession('Session in progress - you can still check in!')
      } else {
        setTimeUntilSession('Session has ended')
      }
    }
  }, [session])

  const loadSessionData = useCallback(async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) {
        router.push('/auth/login')
        return
      }

      // Load session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', params.id)
        .eq('athlete_id', authSession.user.id)
        .single()

      if (sessionError || !sessionData) {
        router.push('/dashboard/athlete/sessions')
        return
      }

      setSession(sessionData)

      // Check if check-in already exists
      const { data: existingCheckin } = await supabase
        .from('pre_training_checkins')
        .select('*')
        .eq('session_id', params.id)
        .maybeSingle()

      // If check-in already exists, pre-populate the form with existing data
      if (existingCheckin) {
        setEnergyLevel(existingCheckin.energy_level)
        setMindsetLevel(existingCheckin.mindset_level)
        setRewardCriteria(existingCheckin.reward_criteria || '')
        setIsEditing(true)
      }

      // Load existing goals
      const { data: goalsData } = await supabase
        .from('session_goals')
        .select('*')
        .eq('session_id', params.id)
        .order('created_at')

      setGoals(goalsData || [])

      // Load advance goals
      const { data: advanceGoalsData } = await supabase
        .from('advance_goals')
        .select('*')
        .eq('session_id', params.id)
        .order('goal_order')

      setAdvanceGoals(advanceGoalsData || [])

      // Load rating theme
      const { data: themeData } = await supabase
        .from('rating_themes')
        .select('*')
        .eq('user_id', authSession.user.id)
        .eq('is_active', true)
        .single()

      setRatingTheme(themeData)

      // Load rewards
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', authSession.user.id)
        .eq('is_active', true)
        .eq('reward_type', 'individual')

      setRewards(rewardsData || [])

      // Pre-populate goals from advance goals or existing goals
      if (advanceGoalsData && advanceGoalsData.length > 0) {
        const prePopulatedGoals = ['', '', '']
        advanceGoalsData.forEach(goal => {
          if (goal.goal_order <= 3) {
            prePopulatedGoals[goal.goal_order - 1] = goal.goal_text
          }
        })
        setFormGoals(prePopulatedGoals)
      } else if (goalsData && goalsData.length > 0) {
        const prePopulatedGoals = ['', '', '']
        goalsData.forEach((goal, index) => {
          if (index < 3) {
            prePopulatedGoals[index] = goal.goal_text
          }
        })
        setFormGoals(prePopulatedGoals)
      }

    } catch (error) {
      console.error('Error loading session data:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    loadSessionData()
  }, [params.id, loadSessionData])

  const handleSubmit = async () => {
    if (!session || !canStartCheckin) return

    // Validate minimum requirements
    const validGoals = formGoals.filter(goal => goal.trim() !== '')
    if (validGoals.length === 0) {
      alert('Please set at least one goal before starting training.')
      return
    }

    if (energyLevel === 0 || mindsetLevel === 0) {
      alert('Please rate your energy and mindset levels.')
      return
    }

    setSubmitting(true)

    try {
      // Save/update goals
      for (let i = 0; i < formGoals.length; i++) {
        const goalText = formGoals[i].trim()
        if (goalText) {
          const existingGoal = goals[i]
          if (existingGoal) {
            // Update existing goal
            await supabase
              .from('session_goals')
              .update({ goal_text: goalText })
              .eq('id', existingGoal.id)
          } else {
            // Create new goal
            await supabase
              .from('session_goals')
              .insert({
                session_id: params.id,
                goal_text: goalText
              })
          }
        }
      }

      // Save or update pre-training check-in
      const { error: checkinError } = await supabase
        .from('pre_training_checkins')
        .upsert({
          session_id: params.id,
          energy_level: energyLevel,
          mindset_level: mindsetLevel,
          reward_criteria: rewardCriteria || null,
          reward_earned: false
        }, {
          onConflict: 'session_id'
        })

      if (checkinError) {
        console.error('Error saving check-in:', checkinError)
        alert('Error saving check-in. Please try again.')
        return
      }

      // Don't update session status here - keep it as 'scheduled'
      // Session status should only change to 'in_progress' when user actually starts training

      // Navigate back to dashboard to show updated button state
      router.push('/dashboard/athlete')

    } catch (error) {
      console.error('Error submitting check-in:', error)
      alert('Error submitting check-in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingLabel = (level: number, type: 'energy' | 'mindset') => {
    if (!ratingTheme || !ratingTheme.rating_labels) return `${level}/5`
    
    const labels = ratingTheme.rating_labels as string[]
    return labels[level - 1] || `${level}/5`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session details...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Session not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <BackButton href={`/dashboard/athlete/sessions/${params.id}`} />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? 'Update Pre-Training Check-in' : 'Pre-Training Check-in'}
          </h1>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {formatDate(session.scheduled_date)}
            </h2>
            <p className="text-lg text-primary-600 font-medium">
              {formatTime(session.start_time)} - {formatTime(session.end_time)}
            </p>
            
            {!canStartCheckin && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800">
                    Check-in available {timeUntilSession} before session
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Goals Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-4">
            <Target className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Training Goals</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Set up to 3 goals for today&apos;s training. At least 1 goal is required.
          </p>
          
          <div className="space-y-4">
            {formGoals.map((goal, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    goal.trim() ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => {
                    const newGoals = [...formGoals]
                    newGoals[index] = e.target.value
                    setFormGoals(newGoals)
                  }}
                  placeholder={`Goal ${index + 1}${index === 0 ? ' (required)' : ''}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Reward Criteria Section */}
        {rewards.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Reward Goal</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              What will you focus on today to earn a star?
            </p>
            
            <select
              value={selectedReward}
              onChange={(e) => setSelectedReward(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
            >
              <option value="">Select a reward to work towards</option>
              {rewards.map((reward) => (
                <option key={reward.id} value={reward.id}>
                  {reward.reward_name} ({reward.stars_required} stars)
                </option>
              ))}
            </select>
            
            {selectedReward && (
              <textarea
                value={rewardCriteria}
                onChange={(e) => setRewardCriteria(e.target.value)}
                placeholder="What specific action or mindset will you focus on today?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            )}
          </div>
        )}

        {/* Energy & Mindset Ratings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How are you feeling?</h3>
          
          {/* Energy Level */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Energy Level
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setEnergyLevel(level)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    energyLevel >= level
                      ? 'bg-yellow-400 text-yellow-900'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {level}
                </button>
              ))}
              {energyLevel > 0 && (
                <span className="ml-3 text-sm text-gray-600">
                  {getRatingLabel(energyLevel, 'energy')}
                </span>
              )}
            </div>
          </div>

          {/* Mindset Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mindset Level
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setMindsetLevel(level)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    mindsetLevel >= level
                      ? 'bg-blue-400 text-blue-900'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {level}
                </button>
              ))}
              {mindsetLevel > 0 && (
                <span className="ml-3 text-sm text-gray-600">
                  {getRatingLabel(mindsetLevel, 'mindset')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={!canStartCheckin || submitting}
            className={`inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
              canStartCheckin && !submitting
                ? 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating Check-in...' : 'Starting Training...'}
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                {isEditing ? 'Update Check-in' : "I'm Ready to Train!"}
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </button>
          
          {!canStartCheckin && (
            <p className="mt-2 text-sm text-gray-500">
              Check-in will be available 1 hour before your session
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
