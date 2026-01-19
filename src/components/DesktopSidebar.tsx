'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Clock, TrendingUp, Target, Settings, BarChart3, BookOpen, History } from 'lucide-react'

interface DesktopSidebarProps {
  role: 'athlete' | 'coach'
}

export function DesktopSidebar({ role }: DesktopSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === `/dashboard/${role}`) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  const athleteNavItems = [
    { name: 'Dashboard', href: `/dashboard/athlete`, icon: Home },
    { name: 'Sessions', href: `/dashboard/athlete/sessions`, icon: Clock },
    { name: 'Schedule', href: `/dashboard/athlete/schedule`, icon: Calendar },
    { name: 'Goals', href: `/dashboard/athlete/goals`, icon: Target },
    { name: 'Progress', href: `/dashboard/athlete/progress`, icon: TrendingUp },
    { name: 'Settings', href: `/dashboard/athlete/settings`, icon: Settings },
  ]

  const coachNavItems = [
    { name: 'Dashboard', href: `/dashboard/coach`, icon: Home },
    { name: 'Athletes', href: `/dashboard/coach/athletes`, icon: BarChart3 },
    { name: 'Journals', href: `/dashboard/coach/journals`, icon: BookOpen },
    { name: 'Sessions', href: `/dashboard/coach/sessions`, icon: History },
    { name: 'Settings', href: `/dashboard/coach/settings`, icon: Settings },
  ]

  const navItems = role === 'athlete' ? athleteNavItems : coachNavItems

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:pt-16">
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all
                ${
                  active
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={`mr-3 h-5 w-5 ${active ? 'text-primary-600' : 'text-gray-400'}`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
