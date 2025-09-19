'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Minus } from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

interface Goal {
  id: string
  goal_text: string
  achieved: boolean | null
}

export default function ReflectionPage({ params }: PageProps) {
  const [session, setSession] = useState<any>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reflection, setReflection] = useState({
    what_went_well: '',
    what_didnt_go_well: '',
    what_to_do_different: '',
    most_proud_of: '',
    overall_rating: 3
  })
  const router = useRouter()

  useEffect(() => {
    fetchSessionData()
  }, [])

  const fetchSessionData = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) {
        router.push('/auth/login')
        return
      }

      // Fetch session details
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

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('session_goals')
        .select('*')
        .eq('session_id', params.id)
        .order('created_at')

      setGoals(goalsData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoalUpdate = async (goalId: string, achieved: boolean | null) => {
    try {
      const { error } = await supabase
        .from('session_goals')
        .update({ achieved })
        .eq('id', goalId)

      if (error) {
        console.error('Error updating goal:', error)
      } else {
        setGoals(goals.map(goal => 
          goal.id === goalId ? { ...goal, achieved } : goal
        ))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) return

      // Save reflection
      const { error: reflectionError } = await supabase
        .from('session_reflections')
        .insert({
          session_id: params.id,
          ...reflection
        })

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
        console.error('Error updating session:', sessionError)
        alert('Error updating session. Please try again.')
        return
      }

      // Redirect to stats/progress page
      router.push(`/dashboard/athlete/sessions/${params.id}?completed=true`)
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-600">Session not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Great job completing your training!
          </h1>
          <p className="text-gray-600">
            Take a moment to reflect on your session and set yourself up for future success.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Goals Review */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Goal Review</h2>
          <p className="text-sm text-gray-600 mb-4">
            How did you do with your training goals today?
          </p>
          
          {goals.length > 0 ? (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    {goal.goal_text}
                  </p>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => handleGoalUpdate(goal.id, true)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        goal.achieved === true
                          ? 'bg-green-100 text-green-800 border-2 border-green-500'
                          : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Got it!</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGoalUpdate(goal.id, false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        goal.achieved === false
                          ? 'bg-red-100 text-red-800 border-2 border-red-500'
                          : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-red-50'
                      }`}
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Not quite</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGoalUpdate(goal.id, null)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        goal.achieved === null
                          ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-500'
                          : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-yellow-50'
                      }`}
                    >
                      <Minus className="h-4 w-4" />
                      <span>Partially</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No goals were set for this session</p>
            </div>
          )}
        </div>

        {/* Reflection Questions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Training Reflection</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What went well during training today?
              </label>
              <textarea
                value={reflection.what_went_well}
                onChange={(e) => setReflection({...reflection, what_went_well: e.target.value})}
                placeholder="Think about the positive aspects of your training session..."
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What didn&apos;t go well or could be improved?
              </label>
              <textarea
                value={reflection.what_didnt_go_well}
                onChange={(e) => setReflection({...reflection, what_didnt_go_well: e.target.value})}
                placeholder="Be honest about challenges and areas for improvement..."
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What will you do differently next time to help you move forwards?
              </label>
              <textarea
                value={reflection.what_to_do_different}
                onChange={(e) => setReflection({...reflection, what_to_do_different: e.target.value})}
                placeholder="Think about specific actions you can take in future sessions..."
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are you most proud of from today&apos;s training?
              </label>
              <textarea
                value={reflection.most_proud_of}
                onChange={(e) => setReflection({...reflection, most_proud_of: e.target.value})}
                placeholder="Celebrate your achievements, no matter how small..."
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall, how was your training today?
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReflection({...reflection, overall_rating: rating})}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                      rating <= reflection.overall_rating
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-primary-500'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
                <span className="ml-3 text-sm text-gray-600">
                  {reflection.overall_rating === 1 && 'Poor'}
                  {reflection.overall_rating === 2 && 'Fair'}
                  {reflection.overall_rating === 3 && 'Good'}
                  {reflection.overall_rating === 4 && 'Very Good'}
                  {reflection.overall_rating === 5 && 'Excellent'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Ready to complete your training reflection?
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-secondary-600 hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Complete Journal Entry'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
