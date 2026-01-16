'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Settings, User, Bell, Shield, Palette, Gift, UserPlus, Users, Key, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'
import RewardManager from '@/components/RewardManager'
import TimezoneSettings from '@/components/TimezoneSettings'
import UserCodeDisplay from '@/components/UserCodeDisplay'
import AddByCodeInput from '@/components/AddByCodeInput'
import PendingConnectionRequests from '@/components/PendingConnectionRequests'
import { getFullName } from '@/lib/utils'
import { ConnectionRequest } from '@/types/connections'
import { SettingsSkeleton } from '@/components/skeletons/settings-skeleton'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connectedCoaches, setConnectedCoaches] = useState<ConnectionRequest[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
    fetchConnectedCoaches()
  }, [refreshKey])

  const fetchProfile = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()

      if (!authSession) {
        router.push('/auth/login')
        return
      }

      setSession(authSession)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authSession.user.id)
        .single()

      if (!profileData || profileData.role !== 'athlete') {
        router.push('/auth/login')
        return
      }

      setProfile(profileData)
    } catch (error) {
      console.error('Error fetching profile:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchConnectedCoaches = async () => {
    try {
      const response = await fetch('/api/connections?status=active&role=athlete')
      const data = await response.json()
      if (response.ok) {
        setConnectedCoaches(data.connections || [])
      }
    } catch (error) {
      console.error('Error fetching coaches:', error)
    }
  }

  const handleTimezoneUpdate = (timezone: string, autoDetected: boolean) => {
    // Update local state
    setProfile((prev: any) => ({
      ...prev,
      timezone,
      timezone_auto_detected: autoDetected
    }))
  }

  const handleConnectionUpdate = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return <SettingsSkeleton />
  }

  if (!profile) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-base text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Your Athlete Code - Prominent Display */}
      {profile.user_code && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary-500 rounded-full p-2">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-primary-900">Your Athlete Code</h2>
          </div>
          <p className="text-primary-700 mb-4">
            Share this code with your coach so they can connect with you
          </p>
          <UserCodeDisplay code={profile.user_code} size="lg" />
        </div>
      )}

      {/* Pending Connection Requests */}
      <PendingConnectionRequests
        userRole="athlete"
        onUpdate={handleConnectionUpdate}
        className="mb-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connect with Coach */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <UserPlus className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Connect with a Coach
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Enter your coach&apos;s code to send them a connection request
            </p>
            <AddByCodeInput
              expectedRole="coach"
              onSuccess={handleConnectionUpdate}
            />
          </div>
        </div>

        {/* Your Coaches */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Your Coaches
              </h3>
            </div>
            {connectedCoaches.length > 0 ? (
              <div className="space-y-3">
                {connectedCoaches.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {connection.coach ? getFullName(connection.coach.first_name, connection.coach.last_name) : 'Unknown Coach'}
                      </p>
                      {connection.coach?.user_code && (
                        <code className="text-xs text-primary-600 font-mono">
                          {connection.coach.user_code}
                        </code>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                      Connected
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No coaches connected yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Use the search above to connect with your coach
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Account Settings */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Account Settings
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  value={profile.first_name || ''}
                  disabled
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profile.last_name || ''}
                  disabled
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Palette className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Preferences
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Theme
                </label>
                <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                  <option>Zelda</option>
                  <option>Mario</option>
                  <option>Pokemon</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Notifications
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Training Reminders
                  </label>
                  <p className="text-sm text-gray-500">
                    Get notified before training sessions
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Goal Updates
                  </label>
                  <p className="text-sm text-gray-500">
                    Get notified about goal progress
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Privacy & Security
              </h3>
            </div>
            <div className="space-y-3">
              <Button
                variant="ghost"
                fullWidth
                leftIcon={<Key className="h-4 w-4" />}
                className="justify-start"
              >
                Change Password
              </Button>
              <Button
                variant="ghost"
                fullWidth
                leftIcon={<Download className="h-4 w-4" />}
                className="justify-start"
              >
                Download Data
              </Button>
              <Button
                variant="ghost"
                fullWidth
                leftIcon={<Trash2 className="h-4 w-4" />}
                className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>

        {/* Rewards Management */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <RewardManager />
          </div>
        </div>

        {/* Timezone Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <TimezoneSettings 
              currentTimezone={profile.timezone || 'UTC'}
              autoDetected={profile.timezone_auto_detected || false}
              onTimezoneUpdate={handleTimezoneUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}



