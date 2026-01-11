'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, Rocket } from 'lucide-react'
import SessionManagementHelper from './SessionManagementHelper'
import { getSessionButtonState } from '@/lib/session-utils'

interface SessionButtonProps {
  session: any
  checkin: any
}

export default function SessionButton({ session, checkin }: SessionButtonProps) {
  const [buttonState, setButtonState] = useState({
    text: 'Loading...',
    href: '#',
    description: '',
    disabled: true
  })
  const [showHelper, setShowHelper] = useState(false)

  useEffect(() => {
    if (!session) return

    // Convert server-side session data to client-side with proper timezone handling
    const now = new Date()
    
    // Parse the session times as local time (not UTC)
    const [year, month, day] = session.scheduled_date.split('-').map(Number)
    const [startHour, startMin, startSec] = session.start_time.split(':').map(Number)
    const [endHour, endMin, endSec] = session.end_time.split(':').map(Number)
    
    // Create local date objects
    const sessionStart = new Date(year, month - 1, day, startHour, startMin, startSec)
    const sessionEnd = new Date(year, month - 1, day, endHour, endMin, endSec)
    
    // Create a modified session object with local times
    const localSession = {
      ...session,
      scheduled_date: session.scheduled_date,
      start_time: session.start_time,
      end_time: session.end_time
    }
    
    // Calculate button state with proper timezone handling
    const canStartCheckin = now <= sessionEnd
    const sessionTimePassed = now > sessionEnd
    const isSessionTime = now >= sessionStart && now <= sessionEnd
    
    console.log('Client-side button state debug:', {
      sessionId: session.id,
      sessionStatus: session.status,
      hasCheckin: !!checkin,
      now: now.toISOString(),
      sessionStart: sessionStart.toISOString(),
      sessionEnd: sessionEnd.toISOString(),
      canStartCheckin,
      isSessionTime,
      sessionTimePassed
    })
    
    let newButtonState
    
    // Check if session is past due and not completed/absent
    if (sessionTimePassed && !['completed', 'absent', 'cancelled'].includes(session.status)) {
      setShowHelper(true)
      return
    }
    
    setShowHelper(false)
    
    if (!checkin) {
      // No check-in completed
      if (canStartCheckin) {
        newButtonState = {
          text: 'Start Pre-Training Check-in',
          href: `/dashboard/athlete/sessions/${session.id}/checkin`,
          description: 'Athlete has not completed pre-training check-in for the session',
          disabled: false
        }
      } else {
        newButtonState = {
          text: 'Start Pre-Training Check-in',
          href: `/dashboard/athlete/sessions/${session.id}/checkin`,
          description: 'Check-in available 1 hour before session or during session time',
          disabled: true
        }
      }
    } else {
      // Check-in completed - now check timing
      if (now < sessionStart) {
        // Session hasn't started yet - allow editing check-in
        newButtonState = {
          text: 'Start Pre-Training Check-in',
          href: `/dashboard/athlete/sessions/${session.id}/checkin`,
          description: 'Pre-training check-in completed. You can review or update your goals before the session starts.',
          disabled: false
        }
      } else if (isSessionTime) {
        // Session time has started - show training button
        newButtonState = {
          text: session.status === 'in_progress' ? 'Continue Training' : 'Start Training',
          href: `/dashboard/athlete/sessions/${session.id}/training`,
          description: session.status === 'in_progress' 
            ? 'Athlete has started training and it is within the session time'
            : 'Pre-training check-in completed. Ready to start training.',
          disabled: false
        }
      } else {
        // Session time has ended
        newButtonState = {
          text: 'Complete Reflection',
          href: `/dashboard/athlete/sessions/${session.id}/reflection`,
          description: 'Athlete has completed pre-training check-in for the session and the session time has completed',
          disabled: false
        }
      }
    }
    
    if (session.status === 'completed') {
      newButtonState = {
        text: 'View Reflection',
        href: `/dashboard/athlete/sessions/${session.id}/reflection`,
        description: 'Training session completed',
        disabled: false
      }
    }
    
    if (session.status === 'absent') {
      newButtonState = {
        text: 'Session Marked Absent',
        href: '#',
        description: 'This session has been marked as absent',
        disabled: true
      }
    }
    
    setButtonState(newButtonState)
  }, [session, checkin])

  return (
    <div className="flex justify-center">
      {showHelper ? (
        <SessionManagementHelper 
          sessionId={session.id}
          onUpdated={() => window.location.reload()}
        />
      ) : buttonState.disabled ? (
        <button
          disabled
          aria-label={`${buttonState.text} - ${buttonState.description}`}
          aria-disabled="true"
          className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-gray-400 text-gray-200 cursor-not-allowed"
        >
          <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
          <Rocket className="w-4 h-4 mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">{buttonState.text}</span>
          <span className="sm:hidden">Start</span>
        </button>
      ) : (
        <Link
          href={buttonState.href}
          aria-label={`${buttonState.text} - ${buttonState.description}`}
          className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
          <Rocket className="w-4 h-4 mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">{buttonState.text}</span>
          <span className="sm:hidden">Start</span>
        </Link>
      )}
    </div>
  )
}
