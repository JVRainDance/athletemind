'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'
import { CheckCircle, Target, Star, ArrowRight, Trophy } from 'lucide-react'
import BackButton from '@/components/BackButton'

type Session = Database['public']['Tables']['training_sessions']['Row']
type Goal = Database['public']['Tables']['session_goals']['Row']
type Reflection = Database['public']['Tables']['session_reflections']['Row']

interface PageProps {
  params: {
    id: string
  }
}

export default function ReflectionPage({ params }: PageProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [session, setSession] = useState<Session | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [existingReflection, setExistingReflection] = useState<Reflection | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [goalAchievements, setGoalAchievements] = useState<{ [key: string]: 'got_it' | 'not_quite' | 'no' }>({})
  const [whatWentWell, setWhatWentWell] = useState('')
  const [whatDidntGoWell, setWhatDidntGoWell] = useState('')
  const [whatToDoDifferent, setWhatToDoDifferent] = useState('')
  const [mostProudOf, setMostProudOf] = useState('')
  const [overallRating, setOverallRating] = useState(0)
  const [rewardEarned, setRewardEarned] = useState(false)

  useEffect(() => {
    loadSessionData()
  }, [params.id])

  const loadSessionData = async () => {
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

      // Load goals
      const { data: goalsData } = await supabase
        .from('session_goals')
        .select('*')
        .eq('session_id', params.id)
        .order('created_at')

      setGoals(goalsData || [])

      // Load existing reflection
      const { data: reflectionData } = await supabase
        .from('session_reflections')
        .select('*')
        .eq('session_id', params.id)
        .single()

      if (reflectionData) {
        setExistingReflection(reflectionData)
        setWhatWentWell(reflectionData.what_went_well)
        setWhatDidntGoWell(reflectionData.what_didnt_go_well)
        setWhatToDoDifferent(reflectionData.what_to_do_different)
        setMostProudOf(reflectionData.most_proud_of)
        setOverallRating(reflectionData.overall_rating)
      }

    } catch (error) {
      console.error('Error loading session data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!session) return

    // Validate required fields
    if (!whatWentWell.trim() || !whatDidntGoWell.trim() || !whatToDoDifferent.trim() || !mostProudOf.trim()) {
      alert('Please fill in all reflection questions.')
      return
    }

    if (overallRating === 0) {
      alert('Please rate your overall training session.')
      return
    }

    setSubmitting(true)

    try {
      // Update goal achievements
      for (const [goalId, achievement] of Object.entries(goalAchievements)) {
        const achieved = achievement === 'got_it' ? true : false
        await supabase
          .from('session_goals')
          .update({ achieved })
          .eq('id', goalId)
      }

      // Save reflection
      const reflectionData = {
        session_id: params.id,
        what_went_well: whatWentWell.trim(),
        what_didnt_go_well: whatDidntGoWell.trim(),
        what_to_do_different: whatToDoDifferent.trim(),
        most_proud_of: mostProudOf.trim(),
        overall_rating: overallRating
      }

      const { error: reflectionError } = await supabase
        .from('session_reflections')
        .upsert(reflectionData)

      if (reflectionError) {
        console.error('Error saving reflection:', reflectionError)
        alert('Error saving reflection. Please try again.')
        return
      }

      // Update session status to completed
      const { error: sessionError } = await supabase
        .from('training_sessions')
        .update({ status: 'completed' })
        .eq('id', params.id)

      if (sessionError) {
        console.error('Error updating session status:', sessionError)
      }

      // Navigate to progress page with celebration
      router.push('/dashboard/athlete/progress?fromSession=true')

    } catch (error) {
      console.error('Error submitting reflection:', error)
      alert('Error submitting reflection. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getAchievementColor = (achievement: string) => {
    switch (achievement) {
      case 'got_it':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'not_quite':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'no':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reflection...</p>
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
        {/* Back Button */}
        <div className="mb-6">
          <BackButton href={`/dashboard/athlete/sessions/${params.id}`} />
        </div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-yellow-500 mr-2" />
              <h1 className="text-3xl font-bold text-gray-900">
                Yay, you did it! 🎉
              </h1>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {formatDate(session.scheduled_date)}
            </h2>
            <p className="text-lg text-primary-600 font-medium">
              Training Session Complete
            </p>
          </div>
        </div>

        {/* Goals Review */}
        {goals.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
              <Target className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">How did your goals go?</h3>
            </div>
            
            <div className="space-y-3">
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                  <p className="flex-1 text-sm text-gray-700">{goal.goal_text}</p>
                  <div className="flex space-x-2">
                    {['got_it', 'not_quite', 'no'].map((option) => (
                      <button
                        key={option}
                        onClick={() => setGoalAchievements(prev => ({ ...prev, [goal.id]: option as any }))}
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${
                          goalAchievements[goal.id] === option
                            ? getAchievementColor(option)
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {option === 'got_it' ? 'Got it!' : option === 'not_quite' ? 'Not quite' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reflection Questions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Reflection</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What went well during training today?
              </label>
              <textarea
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Share what went well..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What didn&apos;t go well or could be improved?
              </label>
              <textarea
                value={whatDidntGoWell}
                onChange={(e) => setWhatDidntGoWell(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="What could be better next time..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What will you do differently next time?
              </label>
              <textarea
                value={whatToDoDifferent}
                onChange={(e) => setWhatToDoDifferent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your plan for improvement..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are you most proud of from today&apos;s training?
              </label>
              <textarea
                value={mostProudOf}
                onChange={(e) => setMostProudOf(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Celebrate your achievements..."
              />
            </div>
          </div>
        </div>

        {/* Overall Rating */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Training Rating</h3>
          <p className="text-sm text-gray-600 mb-4">How would you rate today&apos;s training overall?</p>
          
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setOverallRating(level)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  overallRating >= level
                    ? 'bg-green-400 text-green-900'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {level}
              </button>
            ))}
            {overallRating > 0 && (
              <span className="ml-3 text-sm text-gray-600">
                {overallRating}/5
              </span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
              !submitting
                ? 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Completing Journal...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Complete Journal Entry
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}