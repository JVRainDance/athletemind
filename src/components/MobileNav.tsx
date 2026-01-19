'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  Home,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  User,
  Settings,
  LogOut,
  BarChart3,
  BookOpen,
  History,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface MobileNavProps {
  firstName?: string
  lastName?: string
}

const athleteNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/athlete', icon: Home },
  { name: 'Sessions', href: '/dashboard/athlete/sessions', icon: Clock },
  { name: 'Schedule', href: '/dashboard/athlete/schedule', icon: Calendar },
  { name: 'Goals', href: '/dashboard/athlete/goals', icon: Target },
  { name: 'Progress', href: '/dashboard/athlete/progress', icon: TrendingUp },
]

const bottomNavItems: NavItem[] = [
  { name: 'Profile', href: '/dashboard/athlete/profile', icon: User },
  { name: 'Settings', href: '/dashboard/athlete/settings', icon: Settings },
]

export function MobileNav({ firstName, lastName }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const isActive = (href: string) => {
    if (href === '/dashboard/athlete') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-[60] p-2 rounded-md bg-white shadow-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[44px] min-h-[44px]"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700" aria-hidden="true" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" aria-hidden="true" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[55] lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu panel */}
      <nav
        className={`
          fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-[56] lg:hidden
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          shadow-2xl overflow-y-auto
        `}
        aria-label="Mobile navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            {firstName && lastName ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {firstName} {lastName}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Athlete</p>
              </div>
            ) : (
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            )}
          </div>

          {/* Main navigation */}
          <div className="flex-1 py-4">
            <div className="px-3 space-y-1">
              {athleteNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors
                      ${
                        active
                          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 flex-shrink-0 ${
                        active ? 'text-primary-600' : 'text-gray-400'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>

            {/* Bottom section */}
            <div className="mt-6 pt-6 border-t border-gray-200 px-3 space-y-1">
              {bottomNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors
                      ${
                        active
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 flex-shrink-0 ${
                        active ? 'text-primary-600' : 'text-gray-400'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}

// Bottom navigation bar for mobile (alternative to hamburger)
interface BottomNavProps {
  role?: 'athlete' | 'coach'
}

export function BottomNav({ role = 'athlete' }: BottomNavProps) {
  const pathname = usePathname()

  const isActive = (href: string, basePath: string) => {
    if (href === basePath) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  const athleteNavItems = [
    { name: 'Home', href: '/dashboard/athlete', icon: Home },
    { name: 'Sessions', href: '/dashboard/athlete/sessions', icon: Clock },
    { name: 'Schedule', href: '/dashboard/athlete/schedule', icon: Calendar },
    { name: 'Progress', href: '/dashboard/athlete/progress', icon: TrendingUp },
  ]

  const coachNavItems = [
    { name: 'Home', href: '/dashboard/coach', icon: Home },
    { name: 'Athletes', href: '/dashboard/coach/athletes', icon: BarChart3 },
    { name: 'Journals', href: '/dashboard/coach/journals', icon: BookOpen },
    { name: 'Sessions', href: '/dashboard/coach/sessions', icon: History },
  ]

  const quickNavItems = role === 'coach' ? coachNavItems : athleteNavItems
  const basePath = role === 'coach' ? '/dashboard/coach' : '/dashboard/athlete'

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around px-1 sm:px-2 py-1 sm:py-2">
        {quickNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, basePath)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center min-w-[56px] sm:min-w-[64px] min-h-[48px] sm:min-h-[56px] px-1 sm:px-2 rounded-lg transition-colors
                ${
                  active
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
              aria-label={item.name}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5" aria-hidden="true" />
              <span className="text-[10px] sm:text-xs font-medium leading-tight">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
