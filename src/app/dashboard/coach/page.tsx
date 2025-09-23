import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Users, Calendar, TrendingUp, CheckCircle, UserPlus } from 'lucide-react'
import { getFullName } from '@/lib/utils'

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
    .select('role, first_name, last_name')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'coach') {
    redirect('/auth/login')
  }

  // Get coach's athletes through the relationship table - simplified query
  const { data: coachAthletes, error: coachAthletesError } = await supabase
    .from('coach_athletes')
    .select('athlete_id')
    .eq('coach_id', session.user.id)
    .eq('is_active', true)

  const assignedIds = coachAthletes?.map(ca => ca.athlete_id) || []
  
  // Get athlete profiles for assigned athletes
  let athletes = []
  if (assignedIds.length > 0) {
    const { data: athleteProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', assignedIds)
    
    athletes = athleteProfiles || []
  }

  // Get recent sessions for coach's athletes
  const { data: recentSessions } = await supabase
    .from('training_sessions')
    .select(`
      *,
      profiles!inner(first_name, last_name)
    `)
    .in('athlete_id', athletes.length > 0 ? athletes.map(a => a.id) : [])
    .order('scheduled_date', { ascending: false })
    .limit(10)

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Coach Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor your athletes&apos; progress and training sessions
          </p>
        </div>
        <a
          href="/dashboard/coach/athletes"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Manage Athletes
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
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

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
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

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
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

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
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
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
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

      {/* Recent Sessions */}
      {recentSessions && recentSessions.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Training Sessions
            </h3>
            <div className="space-y-3">
              {recentSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getFullName(session.profiles?.first_name || '', session.profiles?.last_name)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(session.scheduled_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })} at {session.start_time}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : session.status === 'absent'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
