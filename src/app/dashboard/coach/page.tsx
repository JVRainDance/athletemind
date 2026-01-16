import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Calendar, TrendingUp, CheckCircle, UserPlus, Bell, Clock, History, ArrowRight } from 'lucide-react'
import { getFullName } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function CoachDashboard() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name, user_code')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'coach') {
    redirect('/auth/login')
  }

  // Get pending connection requests count
  const { count: pendingRequestsCount } = await supabase
    .from('coach_athletes')
    .select('id', { count: 'exact', head: true })
    .eq('coach_id', session.user.id)
    .eq('status', 'pending')
    .neq('initiated_by', session.user.id)

  // Get coach's athletes through the relationship table - use status field
  const { data: coachAthletes } = await supabase
    .from('coach_athletes')
    .select('athlete_id')
    .eq('coach_id', session.user.id)
    .eq('status', 'active')

  const assignedIds = coachAthletes?.map(ca => ca.athlete_id) || []

  // Get athlete profiles for assigned athletes
  let athletes: any[] = []
  if (assignedIds.length > 0) {
    const { data: athleteProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', assignedIds)

    athletes = athleteProfiles || []
  }

  // Get today's date at midnight for comparison
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString().split('T')[0]

  // Get upcoming sessions (scheduled for today or later)
  const { data: upcomingSessions } = await supabase
    .from('training_sessions')
    .select(`
      *,
      profiles!inner(first_name, last_name)
    `)
    .in('athlete_id', athletes.length > 0 ? athletes.map(a => a.id) : [])
    .gte('scheduled_date', todayISO)
    .in('status', ['scheduled', 'pending'])
    .order('scheduled_date', { ascending: true })
    .limit(5)

  // Get recent past sessions (completed or missed)
  const { data: recentSessions } = await supabase
    .from('training_sessions')
    .select(`
      *,
      profiles!inner(first_name, last_name)
    `)
    .in('athlete_id', athletes.length > 0 ? athletes.map(a => a.id) : [])
    .lt('scheduled_date', todayISO)
    .order('scheduled_date', { ascending: false })
    .limit(5)

  // Get completion stats for coach's athletes
  const { data: completionStats } = await supabase
    .from('training_sessions')
    .select('status, athlete_id')
    .in('athlete_id', athletes.length > 0 ? athletes.map(a => a.id) : [])
    .in('status', ['completed', 'absent'])

  const totalSessions = completionStats?.length || 0
  const completedSessions = completionStats?.filter(s => s.status === 'completed').length || 0
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Coach Dashboard
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Monitor your athletes&apos; progress and training sessions
          </p>
        </div>
        <Link
          href="/dashboard/coach/athletes"
          className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'gap-2')}
        >
          <UserPlus className="h-4 w-4" />
          Manage Athletes
        </Link>
      </div>

      {/* Pending Connection Requests Alert */}
      {pendingRequestsCount && pendingRequestsCount > 0 && (
        <a
          href="/dashboard/coach/athletes"
          className="block bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:bg-yellow-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 rounded-full p-2">
              <Bell className="h-5 w-5 text-yellow-900" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-yellow-900">
                {pendingRequestsCount} pending connection request{pendingRequestsCount > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-yellow-700">
                Click here to review and respond to athlete requests
              </p>
            </div>
          </div>
        </a>
      )}

      {/* Coach Code Quick Info */}
      {profile.user_code && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-primary-700 mb-1">Your Coach Code</p>
              <code className="text-lg font-mono font-bold text-primary-900 bg-white px-3 py-1 rounded border border-primary-200">
                {profile.user_code}
              </code>
            </div>
            <p className="text-sm text-primary-600">
              Share this code with athletes so they can connect with you
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Athletes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {athletes?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Squad Completion Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {completionRate}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed Sessions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {completedSessions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Sessions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalSessions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Athletes List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Athletes Overview
          </h3>
          {athletes && athletes.length > 0 ? (
            <>
              {/* Mobile View */}
              <div className="space-y-4 sm:hidden">
                {athletes.map((athlete) => {
                  const athleteSessions = recentSessions?.filter(s => s.athlete_id === athlete.id) || []
                  const lastSession = athleteSessions[0]
                  
                  return (
                    <div key={athlete.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {athlete.first_name?.[0]}{athlete.last_name?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {getFullName(athlete.first_name, athlete.last_name)}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {athlete.email}
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        {lastSession ? (
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">Last Session:</div>
                            <div className="text-xs text-gray-500">
                              {new Date(lastSession.scheduled_date).toLocaleDateString()} - {lastSession.status}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No sessions yet</span>
                        )}
                      </div>
                      <a
                        href={`/dashboard/coach/athletes/${athlete.id}`}
                        className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                      >
                        View Details →
                      </a>
                    </div>
                  )
                })}
              </div>
              
              {/* Desktop View */}
              <div className="hidden sm:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Athlete
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recent Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {athletes.map((athlete) => {
                    const athleteSessions = recentSessions?.filter(s => s.athlete_id === athlete.id) || []
                    const lastSession = athleteSessions[0]
                    
                    return (
                      <tr key={athlete.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getFullName(athlete.first_name, athlete.last_name)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {athlete.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lastSession ? (
                            <div className="text-sm text-gray-900">
                              <div>
                                {new Date(lastSession.scheduled_date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                Status: {lastSession.status}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No sessions yet</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a
                            href={`/dashboard/coach/athletes/${athlete.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View Details
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No athletes yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Athletes will appear here once they register and are assigned to your squad.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sessions Grid - Upcoming and Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Upcoming Sessions
                </h3>
              </div>
            </div>
            {upcomingSessions && upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getFullName(session.profiles?.first_name || '', session.profiles?.last_name)}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {new Date(session.scheduled_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })} at {session.start_time}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 bg-blue-100 text-blue-800">
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No upcoming sessions</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Sessions
                </h3>
              </div>
              <Link
                href="/dashboard/coach/sessions"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {recentSessions && recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-3 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getFullName(session.profiles?.first_name || '', session.profiles?.last_name)}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {new Date(session.scheduled_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })} at {session.start_time}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      session.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : session.status === 'absent'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <History className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No past sessions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
