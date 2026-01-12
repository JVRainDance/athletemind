'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { Fragment } from 'react'

interface BreadcrumbItem {
  label: string
  href: string
}

export function Breadcrumbs() {
  const pathname = usePathname()

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (!pathname) return []

    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Map path segments to readable labels
    const labelMap: Record<string, string> = {
      dashboard: 'Dashboard',
      athlete: 'Athlete',
      coach: 'Coach',
      sessions: 'Sessions',
      schedule: 'Schedule',
      goals: 'Goals',
      progress: 'Progress',
      settings: 'Settings',
      profile: 'Profile',
      athletes: 'Athletes',
      checkin: 'Check-in',
      training: 'Training',
      reflection: 'Reflection',
      setup: 'Setup',
    }

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Skip UUIDs and dynamic segments
      if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        breadcrumbs.push({
          label: 'Session',
          href: currentPath,
        })
        return
      }

      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      breadcrumbs.push({
        label,
        href: currentPath,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Don't show breadcrumbs on home pages
  if (breadcrumbs.length <= 2) return null

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
      <Link
        href="/dashboard/athlete"
        className="flex items-center hover:text-primary-600 transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>
      {breadcrumbs.slice(2).map((crumb, index) => {
        const isLast = index === breadcrumbs.slice(2).length - 1
        return (
          <Fragment key={crumb.href}>
            <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
            {isLast ? (
              <span className="font-medium text-gray-900" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-primary-600 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
