'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { getFullName, formatDate } from '@/lib/utils'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'

type Profile = Database['public']['Tables']['profiles']['Row']

interface SessionWithAthlete {
  id: string
  athlete_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  session_type: string
  status: string
  absence_reason?: string
  profiles: {
    first_name: string
    last_name: string | null
  }
}

const ITEMS_PER_PAGE = 10

export default function CoachSessionsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<SessionWithAthlete[]>([])
  const [athletes, setAthletes] = useState<Profile[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // Filters
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Only apply date range filter when both dates are selected or when cleared
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    // Apply filter only when both dates are selected or when cleared
    if (!range || (range.from && range.to)) {
      setAppliedDateRange(range)
    }
  }

  const loadAthletes = useCallback(async () => {
    const { data: { session: authSession } } = await supabase.auth.getSession()
    if (!authSession) return

    // Get coach's connected athletes
    const { data: coachAthletes } = await supabase
      .from('coach_athletes')
      .select('athlete_id')
      .eq('coach_id', authSession.user.id)
      .eq('status', 'active')

    const athleteIds = coachAthletes?.map(ca => ca.athlete_id) || []

    if (athleteIds.length > 0) {
      const { data: athleteProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', athleteIds)

      setAthletes(athleteProfiles || [])
    }
  }, [supabase])

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) {
        router.push('/auth/login')
        return
      }

      // Get coach's connected athletes
      const { data: coachAthletes } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', authSession.user.id)
        .eq('status', 'active')

      let athleteIds = coachAthletes?.map(ca => ca.athlete_id) || []

      // Apply athlete filter
      if (selectedAthletes.length > 0) {
        athleteIds = athleteIds.filter(id => selectedAthletes.includes(id))
      }

      if (athleteIds.length === 0) {
        setSessions([])
        setTotalCount(0)
        setLoading(false)
        return
      }

      // Build query
      let query = supabase
        .from('training_sessions')
        .select(`
          *,
          profiles!inner(first_name, last_name)
        `, { count: 'exact' })
        .in('athlete_id', athleteIds)
        .order('scheduled_date', { ascending: false })
        .order('start_time', { ascending: false })

      // Apply date range filter (only when both dates are set)
      if (appliedDateRange?.from) {
        query = query.gte('scheduled_date', format(appliedDateRange.from, 'yyyy-MM-dd'))
      }
      if (appliedDateRange?.to) {
        query = query.lte('scheduled_date', format(appliedDateRange.to, 'yyyy-MM-dd'))
      }

      // Apply status filter
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      query = query.range(from, to)

      const { data, count, error } = await query

      if (error) {
        console.error('Error loading sessions:', error)
        return
      }

      setSessions(data as SessionWithAthlete[] || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, router, selectedAthletes, appliedDateRange, statusFilter, currentPage])

  useEffect(() => {
    loadAthletes()
  }, [loadAthletes])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedAthletes, appliedDateRange, statusFilter])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'absent':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

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

  const toggleAthleteFilter = (athleteId: string) => {
    setSelectedAthletes(prev =>
      prev.includes(athleteId)
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    )
  }

  const clearFilters = () => {
    setSelectedAthletes([])
    setDateRange(undefined)
    setAppliedDateRange(undefined)
    setStatusFilter('')
  }

  const hasActiveFilters = selectedAthletes.length > 0 || appliedDateRange?.from || statusFilter

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Session History</h1>
          <p className="mt-2 text-base text-gray-600">
            View and filter all training sessions for your athletes
          </p>
        </div>
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          leftIcon={<Filter className="h-4 w-4" />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Filter Sessions</h3>
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                placeholder="Select dates"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="absent">Absent</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Athletes Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Athletes ({selectedAthletes.length} selected)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                {athletes.length > 0 ? (
                  athletes.map((athlete) => (
                    <label
                      key={athlete.id}
                      className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAthletes.includes(athlete.id)}
                        onChange={() => toggleAthleteFilter(athlete.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 truncate">
                        {getFullName(athlete.first_name, athlete.last_name)}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">No athletes connected</p>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              {selectedAthletes.map((athleteId) => {
                const athlete = athletes.find(a => a.id === athleteId)
                return (
                  <span
                    key={athleteId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                  >
                    {athlete ? getFullName(athlete.first_name, athlete.last_name) : 'Unknown'}
                    <button
                      onClick={() => toggleAthleteFilter(athleteId)}
                      className="hover:bg-primary-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              })}
              {appliedDateRange?.from && appliedDateRange?.to && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {format(appliedDateRange.from, 'MMM d')} - {format(appliedDateRange.to, 'MMM d')}
                  <button
                    onClick={() => {
                      setDateRange(undefined)
                      setAppliedDateRange(undefined)
                    }}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full capitalize">
                  {statusFilter}
                  <button
                    onClick={() => setStatusFilter('')}
                    className="hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sessions Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Sessions ({totalCount})
            </h3>
          </div>

          {loading ? (
            <TableSkeleton rows={ITEMS_PER_PAGE} />
          ) : sessions.length > 0 ? (
            <>
              {/* Mobile View */}
              <div className="space-y-4 lg:hidden">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {getStatusIcon(session.status)}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {getFullName(session.profiles?.first_name || '', session.profiles?.last_name)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(session.scheduled_date)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {session.start_time} - {session.end_time}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                    {session.absence_reason && (
                      <p className="text-xs text-red-600 mt-2">
                        Reason: {session.absence_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Athlete
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(session.status)}
                            <span className="text-sm font-medium text-gray-900">
                              {getFullName(session.profiles?.first_name || '', session.profiles?.last_name)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(session.scheduled_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.start_time} - {session.end_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {session.session_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.absence_reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} sessions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      leftIcon={<ChevronLeft className="h-4 w-4" />}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500 px-3">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      rightIcon={<ChevronRight className="h-4 w-4" />}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
              <p className="text-gray-500">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more results.'
                  : 'Your athletes have no training sessions yet.'}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
