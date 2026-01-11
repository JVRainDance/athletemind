/**
 * SessionButton Component (Refactored)
 * Simplified using finite state machine pattern
 */

'use client'

import Link from 'next/link'
import { CheckCircle, Rocket, Eye, Clock, X } from 'lucide-react'
import { useSessionState } from '@/hooks/useSessionState'
import { Button } from '@/components/ui/button'
import SessionManagementHelper from '../SessionManagementHelper'

interface SessionButtonProps {
  session: any
  checkin: any
}

const iconMap = {
  check: CheckCircle,
  rocket: Rocket,
  eye: Eye,
  clock: Clock,
  x: X,
}

export default function SessionButton({ session, checkin }: SessionButtonProps) {
  const { state, buttonConfig, isOverdue } = useSessionState(session, checkin)

  // Show helper for overdue sessions
  if (isOverdue) {
    return (
      <div className="flex justify-center">
        <SessionManagementHelper
          sessionId={session.id}
          onUpdated={() => window.location.reload()}
        />
      </div>
    )
  }

  const Icon = iconMap[buttonConfig.icon]

  // Disabled state
  if (buttonConfig.disabled) {
    return (
      <div className="flex justify-center">
        <Button
          disabled
          variant="ghost"
          className="cursor-not-allowed opacity-50"
          aria-label={`${buttonConfig.text} - ${buttonConfig.description}`}
        >
          <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">{buttonConfig.text}</span>
          <span className="sm:hidden">Start</span>
        </Button>
      </div>
    )
  }

  // Active state - use Link for navigation
  return (
    <div className="flex justify-center">
      <Button
        asChild
        variant={buttonConfig.variant === 'secondary' ? 'outline' : 'default'}
        aria-label={`${buttonConfig.text} - ${buttonConfig.description}`}
      >
        <Link href={buttonConfig.href}>
          <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">{buttonConfig.text}</span>
          <span className="sm:hidden">
            {state === 'training_active' || state === 'training_available' ? 'Train' : 'Start'}
          </span>
        </Link>
      </Button>
    </div>
  )
}
