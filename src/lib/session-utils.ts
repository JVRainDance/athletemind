import { Database } from '@/types/database'

type Session = Database['public']['Tables']['training_sessions']['Row']
type Checkin = Database['public']['Tables']['pre_training_checkins']['Row']

export interface ButtonState {
  text: string
  href: string
  description: string
  disabled: boolean
}

export function getSessionButtonState(session: Session, checkin: Checkin | null): ButtonState {
  const now = new Date()
  
  // Create session times in the user's local timezone
  const sessionStart = new Date(`${session.scheduled_date}T${session.start_time}`)
  const sessionEnd = new Date(`${session.scheduled_date}T${session.end_time}`)
  
  // Very simple logic: allow check-in if session hasn't ended yet
  // This eliminates all timing complexity and timezone issues
  const canStartCheckin = now <= sessionEnd
  
  // Debug logging
  console.log('Button state debug:', {
    sessionId: session.id,
    sessionStatus: session.status,
    hasCheckin: !!checkin,
    checkinId: checkin?.id,
    now: now.toISOString(),
    sessionStart: sessionStart.toISOString(),
    sessionEnd: sessionEnd.toISOString(),
    canStartCheckin
  })
  
  // Check if session time has passed
  const sessionTimePassed = now > sessionEnd
  
  if (!checkin) {
    // No check-in completed
    if (canStartCheckin) {
      console.log('Button state: ENABLED - No checkin, can start checkin')
      return {
        text: 'Start Pre-Training Check-in',
        href: `/dashboard/athlete/sessions/${session.id}/checkin`,
        description: 'Athlete has not completed pre-training check-in for the session',
        disabled: false
      }
    } else {
      console.log('Button state: DISABLED - No checkin, cannot start checkin yet')
      return {
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
      return {
        text: 'Start Pre-Training Check-in',
        href: `/dashboard/athlete/sessions/${session.id}/checkin`,
        description: 'Pre-training check-in completed. You can review or update your goals before the session starts.',
        disabled: false
      }
    } else if (now >= sessionStart && now <= sessionEnd) {
      // Session time has started - show training button
      // Use a more forgiving approach: if there's a checkin and we're in session time,
      // show the training button regardless of exact status
      return {
        text: session.status === 'in_progress' ? 'Continue Training' : 'Start Training',
        href: `/dashboard/athlete/sessions/${session.id}/training`,
        description: session.status === 'in_progress' 
          ? 'Athlete has started training and it is within the session time'
          : 'Pre-training check-in completed. Ready to start training.',
        disabled: false
      }
    } else {
      // Session time has ended
      return {
        text: 'Complete Reflection',
        href: `/dashboard/athlete/sessions/${session.id}/reflection`,
        description: 'Athlete has completed pre-training check-in for the session and the session time has completed',
        disabled: false
      }
    }
  }
  
  if (session.status === 'completed') {
    return {
      text: 'View Reflection',
      href: `/dashboard/athlete/sessions/${session.id}/reflection`,
      description: 'Training session completed',
      disabled: false
    }
  }
  
  if (session.status === 'absent') {
    return {
      text: 'Session Marked Absent',
      href: '#',
      description: 'This session has been marked as absent',
      disabled: true
    }
  }
  
  return {
    text: 'Start Pre-Training Check-in',
    href: `/dashboard/athlete/sessions/${session.id}/checkin`,
    description: 'Athlete has not completed pre-training check-in for the session',
    disabled: true
  }
}
