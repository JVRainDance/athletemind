'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'
import { Users, Search, UserPlus } from 'lucide-react'
import { getFullName } from '@/lib/utils'
import UserCodeDisplay from '@/components/UserCodeDisplay'
import AddByCodeInput from '@/components/AddByCodeInput'
import PendingConnectionRequests from '@/components/PendingConnectionRequests'
import { Button } from '@/components/ui/button'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function CoachAthletesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [coachProfile, setCoachProfile] = useState<Profile | null>(null)
  const [assignedAthletes, setAssignedAthletes] = useState<Profile[]>([])
  const [removing, setRemoving] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadAthletes()
  }, [refreshKey])

  const loadAthletes = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) {
        router.push('/auth/login')
        return
      }

      // Get coach's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authSession.user.id)
        .single()

      setCoachProfile(profileData)

      // Get coach's assigned athletes - use status field for new system
      const { data: coachAthletes } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', authSession.user.id)
        .eq('status', 'active')

      const assignedIds = coachAthletes?.map(ca => ca.athlete_id) || []

      // Get athlete profiles for assigned athletes
      let assigned: Profile[] = []
      if (assignedIds.length > 0) {
        const { data: assignedProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', assignedIds)

        assigned = assignedProfiles || []
      }

      setAssignedAthletes(assigned)

    } catch (error) {
      console.error('Error loading athletes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectionUpdate = () => {
    setRefreshKey(prev => prev + 1)
  }

  const removeAthlete = async (athleteId: string) => {
    try {
      setRemoving(athleteId)
      const { data: { session: authSession } } = await supabase.auth.getSession()

      if (!authSession) return

      const { error } = await supabase
        .from('coach_athletes')
        .update({ status: 'inactive' })
        .eq('coach_id', authSession.user.id)
        .eq('athlete_id', athleteId)

      if (error) {
        console.error('Error removing athlete:', error)
        return
      }

      // Reload athletes
      await loadAthletes()

    } catch (error) {
      console.error('Error removing athlete:', error)
    } finally {
      setRemoving(null)
    }
  }

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Athletes</h1>
        <p className="mt-2 text-base text-gray-600">
          Connect with athletes using their unique codes
        </p>
      </div>

      {/* Your Coach Code - Share with Athletes */}
      {coachProfile?.user_code && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary-500 rounded-full p-2">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-primary-900">Your Coach Code</h2>
          </div>
          <p className="text-primary-700 mb-4">
            Share this code with your athletes so they can connect with you
          </p>
          <UserCodeDisplay code={coachProfile.user_code} size="lg" />
        </div>
      )}

      {/* Pending Connection Requests from Athletes */}
      <PendingConnectionRequests
        userRole="coach"
        onUpdate={handleConnectionUpdate}
        className="mb-6"
      />

      {/* Quick Add by Code */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Search className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Add Athlete by Code
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Enter an athlete&apos;s code to send them a connection request
          </p>
          <AddByCodeInput
            expectedRole="athlete"
            onSuccess={handleConnectionUpdate}
          />
        </div>
      </div>

      {/* Assigned Athletes */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">
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
                      <Button
                        size="sm"
                        variant="link"
                        onClick={() => router.push(`/dashboard/coach/athletes/${athlete.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="link"
                        onClick={() => removeAthlete(athlete.id)}
                        disabled={removing === athlete.id}
                        loading={removing === athlete.id}
                        loadingText="Removing..."
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No athletes connected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add athletes by their code or share your coach code with them.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
