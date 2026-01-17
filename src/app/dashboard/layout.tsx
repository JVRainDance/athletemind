import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getFullName } from '@/lib/utils'
import ProfileDropdown from '@/components/ProfileDropdown'
import { BottomNav } from '@/components/MobileNav'
import { DesktopSidebar } from '@/components/DesktopSidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import Link from 'next/link'

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

  // Determine dashboard home based on role
  const dashboardHome = profile.role === 'coach' ? '/dashboard/coach' : '/dashboard/athlete'

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50 safe-area-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                href={dashboardHome}
                className="text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1"
                aria-label="Go to dashboard home"
              >
                AthleteMind
              </Link>
            </div>
            <div className="flex items-center">
              <ProfileDropdown
                firstName={profile.first_name}
                lastName={profile.last_name}
                role={profile.role as 'athlete' | 'coach'}
              />
            </div>
          </div>
        </div>
      </nav>
      <DesktopSidebar role={profile.role as 'athlete' | 'coach'} />
      <main className="pt-16 lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
          <Breadcrumbs />
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
