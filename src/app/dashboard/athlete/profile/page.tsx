import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { User, Mail, Calendar, Target } from 'lucide-react'
import { getFullName } from '@/lib/utils'

export default async function ProfilePage() {
  const supabase = createClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'athlete') {
    redirect('/auth/login')
  }

  // Get user stats
  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('status')
    .eq('athlete_id', session.user.id)

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('athlete_id', session.user.id)

  const totalSessions = sessions?.length || 0
  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0
  const activeGoals = goals?.filter(g => g.status === 'active').length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">
          Manage your profile information and view your stats
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Personal Information
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getFullName(profile.first_name, profile.last_name)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{profile.role}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member since</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Your Stats
              </h3>
              <dl className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <dt className="text-sm font-medium text-gray-500">Total Sessions</dt>
                    <dd className="text-lg font-medium text-gray-900">{totalSessions}</dd>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <dt className="text-sm font-medium text-gray-500">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">{completedSessions}</dd>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-6 w-6 text-secondary-600" />
                  </div>
                  <div className="ml-3">
                    <dt className="text-sm font-medium text-gray-500">Active Goals</dt>
                    <dd className="text-lg font-medium text-gray-900">{activeGoals}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
