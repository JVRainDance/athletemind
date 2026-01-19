'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Brain,
  Zap,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getFullName } from '@/lib/utils'
import { formatDateInTimezone } from '@/lib/timezone-utils'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'

type Profile = Database['public']['Tables']['profiles']['Row']

interface SessionWithDetails {
  id: string
  athlete_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  session_type: string
  status: string
  profiles: {
    first_name: string
    last_name: string | null
  }
  pre_training_checkins: {
    id: string
    energy_level: number
    mindset_level: number
    reward_criteria: string | null
  }[] | null
  session_goals: {
    id: string
    goal_text: string
    achieved: boolean | null
  }[] | null
  session_reflections: {
    id: string
    what_went_well: string
    what_didnt_go_well: string
    what_to_do_different: string
    most_proud_of: string
    overall_rating: number
  }[] | null
}

export default function CoachJournalsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<SessionWithDetails[]>([])
  const [coachTimezone, setCoachTimezone] = useState<string>('UTC')
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) {
        router.push('/auth/login')
        return
      }

      // Get coach's profile with timezone
      const { data: coachProfile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', authSession.user.id)
        .single()

      const timezone = coachProfile && 'timezone' in coachProfile && coachProfile.timezone
        ? (coachProfile.timezone as string)
        : 'UTC'
      setCoachTimezone(timezone)

      // Get coach's connected athletes
      const { data: coachAthletes } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', authSession.user.id)
        .eq('status', 'active')

      const athleteIds = (coachAthletes?.map(ca => ca.athlete_id) || []) as string[]

      if (athleteIds.length === 0) {
        setSessions([])
        setLoading(false)
        return
      }

      // Calculate date range based on filter
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      let startDate = todayStr
      let endDate = todayStr

      if (dateFilter === 'week') {
        const weekLater = new Date(now)
        weekLater.setDate(weekLater.getDate() + 7)
        endDate = weekLater.toISOString().split('T')[0]
      } else if (dateFilter === 'all') {
        // Get sessions from last 7 days to next 7 days
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        startDate = weekAgo.toISOString().split('T')[0]
        const weekLater = new Date(now)
        weekLater.setDate(weekLater.getDate() + 7)
        endDate = weekLater.toISOString().split('T')[0]
      }

      // Build query for sessions with related data
      let query = supabase
        .from('training_sessions')
        .select(`
          *,
          profiles!inner(first_name, last_name),
          pre_training_checkins(id, energy_level, mindset_level, reward_criteria),
          session_goals(id, goal_text, achieved),
          session_reflections(id, what_went_well, what_didnt_go_well, what_to_do_different, most_proud_of, overall_rating)
        `)
        .in('athlete_id', athleteIds)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true })

      // Apply status filter
      if (statusFilter === 'pending') {
        query = query.in('status', ['scheduled', 'in_progress'])
      } else if (statusFilter === 'completed') {
        query = query.eq('status', 'completed')
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading sessions:', error)
        return
      }

      setSessions((data as SessionWithDetails[]) || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, router, dateFilter, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const toggleExpanded = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  const getCheckinStatus = (session: SessionWithDetails) => {
    const hasCheckin = session.pre_training_checkins && session.pre_training_checkins.length > 0
    const hasGoals = session.session_goals && session.session_goals.length > 0
    return { hasCheckin, hasGoals }
  }

  const getReflectionStatus = (session: SessionWithDetails) => {
    return session.session_reflections && session.session_reflections.length > 0
  }

  const getRatingDisplay = (rating: number, type: 'energy' | 'mindset' | 'overall') => {
    const colors = {
      energy: 'text-yellow-500',
      mindset: 'text-blue-500',
      overall: 'text-green-500'
    }
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i <= rating ? colors[type] : 'bg-gray-200'}`}
            style={{ backgroundColor: i <= rating ? undefined : undefined }}
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">{rating}/5</span>
      </div>
    )
  }

  const getGoalAchievementIcon = (achieved: boolean | null) => {
    if (achieved === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else if (achieved === false) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    return <Clock className="h-4 w-4 text-gray-400" />
  }

  // Calculate summary stats
  const totalSessions = sessions.length
  const sessionsWithCheckin = sessions.filter(s => getCheckinStatus(s).hasCheckin).length
  const sessionsWithGoals = sessions.filter(s => getCheckinStatus(s).hasGoals).length
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const sessionsWithReflection = sessions.filter(s => getReflectionStatus(s)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Athlete Journals</h1>
          <p className="mt-2 text-base text-gray-600">
            View athlete check-ins, goals, and reflections at a glance
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => loadData()}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            Sessions
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Check-ins Done
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {sessionsWithCheckin}/{totalSessions}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Target className="h-4 w-4 text-blue-500" />
            Goals Set
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {sessionsWithGoals}/{totalSessions}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <BookOpen className="h-4 w-4 text-purple-500" />
            Reflections
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {sessionsWithReflection}/{completedSessions || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Filter:</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={dateFilter === 'today' ? 'default' : 'outline'}
            onClick={() => setDateFilter('today')}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant={dateFilter === 'week' ? 'default' : 'outline'}
            onClick={() => setDateFilter('week')}
          >
            This Week
          </Button>
          <Button
            size="sm"
            variant={dateFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setDateFilter('all')}
          >
            All Recent
          </Button>
        </div>
        <div className="border-l border-gray-300 pl-3 flex gap-2">
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
          >
            All Status
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">
          {loading ? (
            <TableSkeleton rows={5} />
          ) : sessions.length > 0 ? (
            <div className="space-y-4">
              {/* Mobile-friendly cards */}
              {sessions.map((session) => {
                const { hasCheckin, hasGoals } = getCheckinStatus(session)
                const hasReflection = getReflectionStatus(session)
                const isExpanded = expandedSessions.has(session.id)
                const checkin = session.pre_training_checkins?.[0]
                const goals = session.session_goals || []
                const reflection = session.session_reflections?.[0]

                return (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Session Header */}
                    <div
                      className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleExpanded(session.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {getFullName(session.profiles?.first_name || '', session.profiles?.last_name)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDateInTimezone(session.scheduled_date, coachTimezone, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })} at {session.start_time}
                            </p>
                          </div>
                        </div>

                        {/* Status indicators */}
                        <div className="flex items-center gap-2">
                          {/* Check-in status */}
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              hasCheckin
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                            title={hasCheckin ? 'Check-in completed' : 'No check-in'}
                          >
                            {hasCheckin ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            Check-in
                          </div>

                          {/* Goals status */}
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              hasGoals
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                            title={`${goals.length} goals`}
                          >
                            <Target className="h-3 w-3" />
                            {goals.length}/3
                          </div>

                          {/* Reflection status (only for completed sessions) */}
                          {session.status === 'completed' && (
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                hasReflection
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                              title={hasReflection ? 'Reflection completed' : 'No reflection'}
                            >
                              <BookOpen className="h-3 w-3" />
                              {hasReflection ? 'Done' : 'Missing'}
                            </div>
                          )}

                          {/* Session status badge */}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              session.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : session.status === 'absent'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {session.status}
                          </span>

                          {/* Expand/collapse icon */}
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-4 border-t border-gray-200 space-y-4">
                        {/* Check-in Details */}
                        {checkin ? (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Pre-Training Check-in
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                  <Zap className="h-4 w-4 text-yellow-500" />
                                  Energy Level
                                </div>
                                {getRatingDisplay(checkin.energy_level, 'energy')}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                  <Brain className="h-4 w-4 text-blue-500" />
                                  Mindset Level
                                </div>
                                {getRatingDisplay(checkin.mindset_level, 'mindset')}
                              </div>
                            </div>
                            {checkin.reward_criteria && (
                              <div className="mt-3 pt-3 border-t border-blue-200">
                                <p className="text-sm text-gray-600">Reward Focus:</p>
                                <p className="text-sm font-medium text-gray-900">{checkin.reward_criteria}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <p className="text-sm text-yellow-800 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              No check-in completed yet
                            </p>
                          </div>
                        )}

                        {/* Goals */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-500" />
                            Session Goals
                          </h4>
                          {goals.length > 0 ? (
                            <div className="space-y-2">
                              {goals.map((goal, idx) => (
                                <div
                                  key={goal.id}
                                  className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-200"
                                >
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-sm font-medium flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <p className="flex-1 text-sm text-gray-900">{goal.goal_text}</p>
                                  <div className="flex-shrink-0" title={
                                    goal.achieved === true ? 'Achieved' :
                                    goal.achieved === false ? 'Not achieved' :
                                    'Not assessed'
                                  }>
                                    {getGoalAchievementIcon(goal.achieved)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No goals set for this session</p>
                          )}
                        </div>

                        {/* Reflection (only show for completed sessions) */}
                        {session.status === 'completed' && (
                          <div className="bg-purple-50 rounded-lg p-4">
                            <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Post-Training Reflection
                            </h4>
                            {reflection ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm text-gray-600">Overall Rating:</span>
                                  {getRatingDisplay(reflection.overall_rating, 'overall')}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                                    <p className="text-xs text-purple-600 font-medium mb-1">What went well?</p>
                                    <p className="text-sm text-gray-900">{reflection.what_went_well}</p>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                                    <p className="text-xs text-purple-600 font-medium mb-1">What didn&apos;t go well?</p>
                                    <p className="text-sm text-gray-900">{reflection.what_didnt_go_well}</p>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                                    <p className="text-xs text-purple-600 font-medium mb-1">What to do differently?</p>
                                    <p className="text-sm text-gray-900">{reflection.what_to_do_different}</p>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                                    <p className="text-xs text-purple-600 font-medium mb-1">Most proud of?</p>
                                    <p className="text-sm text-gray-900">{reflection.most_proud_of}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-red-600 flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                No reflection submitted - athlete should complete this!
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
              <p className="text-gray-500">
                {dateFilter === 'today'
                  ? 'No sessions scheduled for today.'
                  : 'No sessions found for the selected time period.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
