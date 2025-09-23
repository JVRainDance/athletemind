import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getFullName } from '@/lib/utils'
import ProfileDropdown from '@/components/ProfileDropdown'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                AthleteMind
              </h1>
            </div>
            <div className="flex items-center">
              <ProfileDropdown 
                firstName={profile.first_name} 
                lastName={profile.last_name} 
              />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
