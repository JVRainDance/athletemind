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
  const sessionStart = new Date(`${session.scheduled_date}T${session.start_time}`)
  const sessionEnd = new Date(`${session.scheduled_date}T${session.end_time}`)
  const oneHourBefore = new Date(sessionStart.getTime() - 60 * 60 * 1000)
  
  // Debug logging
  console.log('Session timing debug:', {
    now: now.toISOString(),
    sessionStart: sessionStart.toISOString(),
    sessionEnd: sessionEnd.toISOString(),
    oneHourBefore: oneHourBefore.toISOString(),
    timeUntilSession: Math.round((sessionStart.getTime() - now.getTime()) / (1000 * 60)), // minutes
    timeUntilOneHour: Math.round((oneHourBefore.getTime() - now.getTime()) / (1000 * 60)) // minutes
  })
  
  // Check if we're within 1 hour of session start OR if session has started but not ended
  const canStartCheckin = (now >= oneHourBefore && now <= sessionEnd) || (now >= sessionStart && now <= sessionEnd)
  
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
      // Session time has started
      if (session.status === 'in_progress') {
        return {
          text: 'Continue Training',
          href: `/dashboard/athlete/sessions/${session.id}/training`,
          description: 'Athlete has started training and it is within the session time',
          disabled: false
        }
      } else {
        return {
          text: 'Start Training',
          href: `/dashboard/athlete/sessions/${session.id}/training`,
          description: 'Pre-training check-in completed. Ready to start training.',
          disabled: false
        }
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
  
  return {
    text: 'Start Pre-Training Check-in',
    href: `/dashboard/athlete/sessions/${session.id}/checkin`,
    description: 'Athlete has not completed pre-training check-in for the session',
    disabled: true
  }
}
