'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { User, Bell, Shield, Key, Download, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import UserCodeDisplay from '@/components/UserCodeDisplay'
import TimezoneSettings from '@/components/TimezoneSettings'
import { SettingsSkeleton } from '@/components/skeletons/settings-skeleton'

export default function CoachSettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

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

      if (!profileData || profileData.role !== 'coach') {
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

  const handleTimezoneUpdate = (timezone: string, autoDetected: boolean) => {
    setProfile((prev: any) => ({
      ...prev,
      timezone,
      timezone_auto_detected: autoDetected
    }))
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

      {/* Your Coach Code - Prominent Display */}
      {profile.user_code && (
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-500 rounded-full p-2">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-purple-900">Your Coach Code</h2>
          </div>
          <p className="text-purple-700 mb-4">
            Share this code with your athletes so they can connect with you
          </p>
          <UserCodeDisplay code={profile.user_code} size="lg" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    Athlete Session Updates
                  </label>
                  <p className="text-sm text-gray-500">
                    Get notified when athletes complete sessions
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
                    Connection Requests
                  </label>
                  <p className="text-sm text-gray-500">
                    Get notified about new athlete connection requests
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
                    Weekly Summary
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive a weekly summary of athlete progress
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

        {/* Timezone Settings */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
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
