import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
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

  if (!profile) {
    redirect('/auth/login')
  }

  // Redirect to role-specific dashboard
  if (profile.role === 'athlete') {
    redirect('/dashboard/athlete')
  } else if (profile.role === 'coach') {
    redirect('/dashboard/coach')
  }

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900">Welcome to AthleteMind</h1>
      <p className="mt-2 text-gray-600">Please complete your profile setup.</p>
    </div>
  )
}
