import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'
import { getSessionButtonState } from '@/lib/session-utils'
import { CheckCircle, Clock, Calendar, Target, MessageSquare } from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

export default async function SessionDetailPage({ params }: PageProps) {
  const supabase = createClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Fetch session details
  const { data: trainingSession, error: sessionError } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('id', params.id)
    .eq('athlete_id', session.user.id)
    .single()

  if (sessionError || !trainingSession) {
    redirect('/dashboard/athlete/sessions')
  }

  // Fetch session goals
  const { data: goals } = await supabase
    .from('session_goals')
    .select('*')
    .eq('session_id', params.id)
    .order('created_at')

  // Fetch pre-training check-in
  const { data: checkin } = await supabase
    .from('pre_training_checkins')
    .select('*')
    .eq('session_id', params.id)
    .maybeSingle()

  // Fetch training notes
  const { data: notes } = await supabase
    .from('training_notes')
    .select('*')
    .eq('session_id', params.id)
    .order('created_at')

  // Fetch reflection
  const { data: reflection } = await supabase
    .from('session_reflections')
    .select('*')
    .eq('session_id', params.id)
    .single()

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


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Session Details</h1>
          <p className="mt-2 text-gray-600">
            {formatDate(trainingSession.scheduled_date)} at {formatTime(trainingSession.start_time)}
          </p>
        </div>
        <Link
          href="/dashboard/athlete/sessions"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Sessions
        </Link>
      </div>

      {/* Session Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Session Overview</h2>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trainingSession.status)}`}>
            {trainingSession.status}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Date</p>
              <p className="text-sm text-gray-500">{formatDate(trainingSession.scheduled_date)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Time</p>
              <p className="text-sm text-gray-500">
                {formatTime(trainingSession.start_time)} - {formatTime(trainingSession.end_time)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Target className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Type</p>
              <p className="text-sm text-gray-500 capitalize">{trainingSession.session_type}</p>
            </div>
          </div>
        </div>

        {trainingSession.absence_reason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Absence Reason:</strong> {trainingSession.absence_reason}
            </p>
          </div>
        )}
      </div>

      {/* Session Action Button */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Session Actions</h2>
        {(() => {
          const buttonState = getSessionButtonState(trainingSession, checkin)
          return (
            <div>
              <p className="text-gray-600 mb-4">
                {buttonState.description}
              </p>
              {buttonState.disabled ? (
                <button
                  disabled
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-gray-400 text-gray-200 cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {buttonState.text}
                </button>
              ) : (
                <Link
                  href={buttonState.href}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {buttonState.text}
                </Link>
              )}
            </div>
          )
        })()}
      </div>

      {/* Pre-Training Check-in Display */}
      {checkin && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Pre-Training Check-in</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Energy Level</p>
              <div className="mt-1 flex items-center">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full mr-1 ${
                      i < checkin.energy_level ? 'bg-yellow-400' : 'bg-gray-200'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">{checkin.energy_level}/5</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Mindset Level</p>
              <div className="mt-1 flex items-center">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full mr-1 ${
                      i < checkin.mindset_level ? 'bg-blue-400' : 'bg-gray-200'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">{checkin.mindset_level}/5</span>
              </div>
            </div>
          </div>
          {checkin.reward_criteria && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Reward Goal:</strong> {checkin.reward_criteria}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Goals */}
      {goals && goals.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Training Goals</h2>
          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center space-x-3">
                {goal.achieved === true ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : goal.achieved === false ? (
                  <div className="h-5 w-5 rounded-full border-2 border-red-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
                <p className={`text-sm ${goal.achieved === true ? 'text-green-700' : goal.achieved === false ? 'text-red-700' : 'text-gray-700'}`}>
                  {goal.goal_text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training Notes */}
      {notes && notes.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Training Notes</h2>
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border-l-4 border-primary-200 pl-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {note.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{note.note_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reflection */}
      {reflection && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Training Reflection</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900">What went well?</p>
              <p className="mt-1 text-sm text-gray-700">{reflection.what_went_well}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">What didn&apos;t go well or could be improved?</p>
              <p className="mt-1 text-sm text-gray-700">{reflection.what_didnt_go_well}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">What will you do differently next time?</p>
              <p className="mt-1 text-sm text-gray-700">{reflection.what_to_do_different}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">What are you most proud of today?</p>
              <p className="mt-1 text-sm text-gray-700">{reflection.most_proud_of}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Overall Training Rating</p>
              <div className="mt-1 flex items-center">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full mr-1 ${
                      i < reflection.overall_rating ? 'bg-green-400' : 'bg-gray-200'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">{reflection.overall_rating}/5</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
