'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'
import { Users, Plus, Search, UserPlus, X } from 'lucide-react'
import { getFullName } from '@/lib/utils'
import BackButton from '@/components/BackButton'

type Profile = Database['public']['Tables']['profiles']['Row']
type CoachAthlete = Database['public']['Tables']['coach_athletes']['Row']

export default function CoachAthletesPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [athletes, setAthletes] = useState<Profile[]>([])
  const [assignedAthletes, setAssignedAthletes] = useState<Profile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)

  useEffect(() => {
    loadAthletes()
  }, [])

  const loadAthletes = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) {
        router.push('/auth/login')
        return
      }
      
      // Get all athletes
      const { data: allAthletes, error: allAthletesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'athlete')
        .order('first_name')
      
      // Get coach's assigned athletes - simplified query
      const { data: coachAthletes } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', authSession.user.id)
        .eq('is_active', true)

      const assignedIds = coachAthletes?.map(ca => ca.athlete_id) || []
      
      // Get athlete profiles for assigned athletes
      let assigned = []
      if (assignedIds.length > 0) {
        const { data: assignedProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', assignedIds)
        
        assigned = assignedProfiles || []
      }

      setAthletes(allAthletes || [])
      setAssignedAthletes(assigned)

    } catch (error) {
      console.error('Error loading athletes:', error)
    } finally {
      setLoading(false)
    }
  }

  const assignAthlete = async (athleteId: string) => {
    try {
      setAssigning(athleteId)
      const { data: { session: authSession } } = await supabase.auth.getSession()
      
      if (!authSession) return

      const { error } = await supabase
        .from('coach_athletes')
        .insert({
          coach_id: authSession.user.id,
          athlete_id: athleteId
        })

      if (error) {
        console.error('Error assigning athlete:', error)
        alert('Error assigning athlete. They may already be assigned to you.')
        return
      }

      // Reload athletes
      await loadAthletes()
      setShowAssignModal(false)

    } catch (error) {
      console.error('Error assigning athlete:', error)
    } finally {
      setAssigning(null)
    }
  }

  const unassignAthlete = async (athleteId: string) => {
    try {
      setAssigning(athleteId)
      const { data: { session: authSession } } = await supabase.auth.getSession()
      
      if (!authSession) return

      const { error } = await supabase
        .from('coach_athletes')
        .update({ is_active: false })
        .eq('coach_id', authSession.user.id)
        .eq('athlete_id', athleteId)

      if (error) {
        console.error('Error unassigning athlete:', error)
        return
      }

      // Reload athletes
      await loadAthletes()

    } catch (error) {
      console.error('Error unassigning athlete:', error)
    } finally {
      setAssigning(null)
    }
  }

  const filteredAthletes = athletes.filter(athlete => {
    const fullName = getFullName(athlete.first_name, athlete.last_name).toLowerCase()
    const email = athlete.email.toLowerCase()
    const search = searchTerm.toLowerCase()
    
    return (fullName.includes(search) || email.includes(search)) &&
           !assignedAthletes.some(assigned => assigned.id === athlete.id)
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading athletes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <BackButton href="/dashboard/coach" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Manage Athletes</h1>
          <p className="mt-2 text-gray-600">
            Assign and manage your athletes
          </p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Assign Athlete
        </button>
      </div>

      {/* Assigned Athletes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Your Athletes ({assignedAthletes.length})
          </h3>
          {assignedAthletes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedAthletes.map((athlete) => (
                <div key={athlete.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {getFullName(athlete.first_name, athlete.last_name)}
                      </h4>
                      <p className="text-sm text-gray-500">{athlete.email}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/coach/athletes/${athlete.id}`)}
                        className="text-primary-600 hover:text-primary-900 text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => unassignAthlete(athlete.id)}
                        disabled={assigning === athlete.id}
                        className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50"
                      >
                        {assigning === athlete.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No athletes assigned</h3>
              <p className="mt-1 text-sm text-gray-500">
                Assign athletes to start managing their training.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Athlete Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Assign Athlete</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search athletes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {filteredAthletes.length > 0 ? (
                  <div className="space-y-2">
                    {filteredAthletes.map((athlete) => (
                      <div key={athlete.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getFullName(athlete.first_name, athlete.last_name)}
                          </p>
                          <p className="text-xs text-gray-500">{athlete.email}</p>
                        </div>
                        <button
                          onClick={() => assignAthlete(athlete.id)}
                          disabled={assigning === athlete.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                        >
                          {assigning === athlete.id ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {searchTerm ? 'No athletes found matching your search.' : 'All athletes are already assigned to you.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
