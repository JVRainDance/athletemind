'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Settings, Calendar, LogOut, ChevronDown, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface ProfileDropdownProps {
  firstName: string
  lastName: string
  role: 'athlete' | 'coach'
}

export default function ProfileDropdown({ firstName, lastName, role }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`${firstName} ${lastName} profile menu`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center space-x-2 sm:space-x-3 text-gray-900 hover:text-gray-700 transition-colors min-h-[44px] px-1"
      >
        <span
          className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            role === 'coach'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}
          aria-label={`Role: ${role}`}
        >
          {role}
        </span>
        <div className="w-9 h-9 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center border border-gray-200" aria-hidden="true">
          <span className="text-blue-600 font-bold text-sm">{initials}</span>
        </div>
        <span className="hidden sm:inline text-sm font-medium text-gray-700">{firstName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-56 max-w-[224px] bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
          role="menu"
          aria-label="User menu"
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{firstName} {lastName}</p>
            <p className="text-xs text-gray-500 capitalize">{role}</p>
          </div>

          {role === 'athlete' ? (
            <>
              <Link
                href="/dashboard/athlete/profile"
                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px]"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                aria-label="Go to Profile page"
              >
                <User className="w-5 h-5 mr-3" aria-hidden="true" />
                Profile
              </Link>

              <Link
                href="/dashboard/athlete/sessions"
                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px]"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                aria-label="Go to Training Sessions page"
              >
                <Clock className="w-5 h-5 mr-3" aria-hidden="true" />
                Training Sessions
              </Link>

              <Link
                href="/dashboard/athlete/schedule"
                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px]"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                aria-label="Go to Schedule page"
              >
                <Calendar className="w-5 h-5 mr-3" aria-hidden="true" />
                Schedule
              </Link>

              <Link
                href="/dashboard/athlete/settings"
                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px]"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                aria-label="Go to Settings page"
              >
                <Settings className="w-5 h-5 mr-3" aria-hidden="true" />
                Settings
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard/coach"
                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px]"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                aria-label="Go to Dashboard"
              >
                <User className="w-5 h-5 mr-3" aria-hidden="true" />
                Dashboard
              </Link>

              <Link
                href="/dashboard/coach/athletes"
                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px]"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                aria-label="Go to Athletes page"
              >
                <Clock className="w-5 h-5 mr-3" aria-hidden="true" />
                Athletes
              </Link>

              <Link
                href="/dashboard/coach/settings"
                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px]"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                aria-label="Go to Settings page"
              >
                <Settings className="w-5 h-5 mr-3" aria-hidden="true" />
                Settings
              </Link>
            </>
          )}

          <div className="border-t border-gray-100 mt-1">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
              role="menuitem"
              aria-label="Sign out of your account"
            >
              <LogOut className="w-5 h-5 mr-3" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

