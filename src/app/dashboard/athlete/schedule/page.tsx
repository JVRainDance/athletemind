import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Calendar, Plus, Clock, Trash2 } from 'lucide-react'
import BackButton from '@/components/BackButton'
import Link from 'next/link'
import ScheduleForm from '@/components/ScheduleForm'
import ScheduleDeleteButton from '@/components/ScheduleDeleteButton'

export default async function SchedulePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'athlete') {
    redirect('/auth/login')
  }

  // Get training schedule (weekly template)
  const { data: schedule } = await supabase
    .from('training_schedules')
    .select('*')
    .eq('athlete_id', user.id)
    .order('day_of_week', { ascending: true })

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training Schedule</h1>
          <p className="mt-2 text-base text-gray-600">
            Set your weekly training schedule template
          </p>
        </div>
        <ScheduleForm athleteId={user.id} />
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Your Weekly Training Schedule
          </h3>
          {schedule && schedule.length > 0 ? (
            <div className="space-y-3">
              {schedule.map((scheduleItem) => (
                <div
                  key={scheduleItem.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {dayNames[scheduleItem.day_of_week]}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(`2000-01-01T${scheduleItem.start_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })} - {new Date(`2000-01-01T${scheduleItem.end_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {scheduleItem.session_type}
                    </span>
                    <ScheduleDeleteButton
                      scheduleId={scheduleItem.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No training schedule</h3>
              <p className="mt-1 text-sm text-gray-500">
                Set up your weekly training schedule to automatically generate sessions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Calendar className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              How it works
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Set your weekly training schedule here. The system will automatically generate 
                individual training sessions based on this template, ensuring you always have 
                sessions scheduled 7 days ahead.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}