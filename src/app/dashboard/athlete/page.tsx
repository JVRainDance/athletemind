import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Target, TrendingUp, Clock, CheckCircle, Plus, X, Star, Rocket, Settings, User, LogOut, ChevronDown } from 'lucide-react'
import { getFullName } from '@/lib/utils'
import ProfileDropdown from '@/components/ProfileDropdown'

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

  // Get next training session
  const { data: nextSession } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('athlete_id', session.user.id)
    .gte('scheduled_date', new Date().toISOString())
    .order('scheduled_date', { ascending: true })
    .limit(1)
    .single()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hi {getFullName(profile.first_name, profile.last_name)}!
          </h1>
          <p className="mt-2 text-gray-600">
            Ready to show up, reflect, and build momentum?
          </p>
        </div>
        <ProfileDropdown 
          firstName={profile.first_name} 
          lastName={profile.last_name} 
        />
      </div>

      {/* Next Training Session Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Your next available training is...
          </h2>
          {nextSession ? (
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Date(nextSession.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-lg text-primary-600 font-medium">
                  {nextSession.start_time} - {nextSession.end_time}
                </p>
              </div>
              <Link
                href={`/dashboard/athlete/sessions/${nextSession.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                <Rocket className="w-4 h-4 mr-2" />
                Start Pre-Training Check-in
              </Link>
            </div>
          ) : (
            <p className="text-gray-500">No upcoming training sessions scheduled</p>
          )}
        </div>
      </div>

      {/* Training Actions Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Training Actions</h2>
          <div className="flex space-x-4 mb-4">
            <button className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Record an absence
            </button>
            <button className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Add an extra session
            </button>
          </div>
          <div className="flex items-center space-x-2">
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
      <div className="bg-white shadow rounded-lg">
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
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Would you like to...</h2>
          <div className="space-y-4">
            <Link
              href="/dashboard/athlete/goals"
              className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Set your daily training goals in advance?</p>
                <p className="text-sm text-gray-600">Plan your objectives for upcoming sessions</p>
              </div>
            </Link>
            <Link
              href="/dashboard/athlete/progress"
              className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View your training journey so far?</p>
                <p className="text-sm text-gray-600">Review your progress and achievements</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}