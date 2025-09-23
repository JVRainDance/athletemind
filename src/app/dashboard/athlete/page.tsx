import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Target, TrendingUp, Clock, CheckCircle, Plus, X, Star, Rocket, BarChart3 } from 'lucide-react'
import { getFullName } from '@/lib/utils'
import { getSessionButtonState } from '@/lib/session-utils'
import AbsenceButton from '@/components/AbsenceButton'
import ExtraSessionButton from '@/components/ExtraSessionButton'
import SessionCountdown from '@/components/SessionCountdown'

export default async function AthleteDashboard() {
  const supabase = createClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'athlete') {
    redirect('/auth/login')
  }

  // Get next training session (exclude completed and absent sessions)
  // Use a very lenient date filter to handle all timezone issues
  const { data: nextSession } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('athlete_id', session.user.id)
    .in('status', ['scheduled', 'in_progress', 'cancelled'])
    .order('scheduled_date', { ascending: true })
    .limit(1)
    .single()

  // Get check-in for next session if it exists
  let nextSessionCheckin = null
  if (nextSession) {
    const { data: checkinData, error: checkinError } = await supabase
      .from('pre_training_checkins')
      .select('*')
      .eq('session_id', nextSession.id)
      .maybeSingle()
    
    // Debug logging
    console.log('Dashboard debug:', {
      sessionId: nextSession.id,
      sessionStatus: nextSession.status,
      checkinData,
      checkinError
    })
    
    nextSessionCheckin = checkinData
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mt-2 text-gray-600">
          Ready to show up, reflect, and build momentum?
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
                  {nextSession.start_time} - {nextSession.end_time}
                </p>
              </div>
              
              {/* Countdown Timer */}
              <div className="flex justify-center">
                <SessionCountdown 
                  sessionDate={nextSession.scheduled_date}
                  sessionTime={nextSession.start_time}
                />
              </div>
              
              {(() => {
                const buttonState = getSessionButtonState(nextSession, nextSessionCheckin)
                return (
                  <div className="flex justify-center">
                    {buttonState.disabled ? (
                      <button
                        disabled
                        className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-gray-400 text-gray-200 cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <Rocket className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">{buttonState.text}</span>
                        <span className="sm:hidden">Start</span>
                      </button>
                    ) : (
                      <Link
                        href={buttonState.href}
                        className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <Rocket className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">{buttonState.text}</span>
                        <span className="sm:hidden">Start</span>
                      </Link>
                    )}
                  </div>
                )
              })()}
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

      {/* Rewards Card */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-2 mb-4">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Your Next Reward</h2>
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-lg font-medium text-gray-900">Rollerblades</p>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div className="bg-yellow-400 h-3 rounded-full" style={{ width: '87%' }}></div>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-gray-900">13/15</span>
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Keep earning stars through your training sessions to reach your reward
            </p>
          </div>
        </div>
      </div>

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