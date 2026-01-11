/**
 * Session State Machine
 * Pure function to determine session state without side effects
 */

export type SessionState =
  | 'awaiting_checkin'      // Before checkin window opens
  | 'checkin_available'     // Can do checkin
  | 'checkin_completed'     // Checkin done, before session
  | 'training_available'    // Can start training
  | 'training_active'       // Training in progress
  | 'reflection_available'  // Can do reflection
  | 'completed'             // Session completed
  | 'absent'                // Marked absent
  | 'overdue'              // Session time passed, not completed

export interface SessionButtonConfig {
  text: string
  href: string
  description: string
  disabled: boolean
  icon: 'check' | 'rocket' | 'eye' | 'clock' | 'x'
  variant: 'primary' | 'secondary' | 'disabled' | 'warning'
}

interface Session {
  id: string
  status: string
  scheduled_date: string
  start_time: string
  end_time: string
}

interface Checkin {
  id: string
  session_id: string
}

/**
 * Parse session times as local time (not UTC)
 */
function parseSessionTimes(session: Session) {
  const [year, month, day] = session.scheduled_date.split('-').map(Number)
  const [startHour, startMin] = session.start_time.split(':').map(Number)
  const [endHour, endMin] = session.end_time.split(':').map(Number)

  const sessionStart = new Date(year, month - 1, day, startHour, startMin, 0)
  const sessionEnd = new Date(year, month - 1, day, endHour, endMin, 0)

  // Checkin window opens 1 hour before session start
  const checkinWindowStart = new Date(sessionStart.getTime() - 60 * 60 * 1000)

  return { sessionStart, sessionEnd, checkinWindowStart }
}

/**
 * Determine the current state of a session
 * Pure function - no side effects
 */
export function getSessionState(
  session: Session,
  checkin: Checkin | null,
  now: Date = new Date()
): SessionState {
  // Handle terminal states first
  if (session.status === 'completed') return 'completed'
  if (session.status === 'absent') return 'absent'
  if (session.status === 'cancelled') return 'absent'

  const { sessionStart, sessionEnd, checkinWindowStart } = parseSessionTimes(session)

  // Check if session time has passed
  const sessionTimePassed = now > sessionEnd

  // Overdue: session time passed but not completed/absent
  if (sessionTimePassed) {
    return 'overdue'
  }

  const checkinWindowOpen = now >= checkinWindowStart && now <= sessionEnd
  const isSessionTime = now >= sessionStart && now <= sessionEnd

  // No checkin completed yet
  if (!checkin) {
    return checkinWindowOpen ? 'checkin_available' : 'awaiting_checkin'
  }

  // Checkin completed - determine next step
  if (now < sessionStart) {
    // Before session start - can edit checkin
    return 'checkin_completed'
  }

  if (isSessionTime) {
    // During session time
    return session.status === 'in_progress' ? 'training_active' : 'training_available'
  }

  // After session end - need reflection
  return 'reflection_available'
}

/**
 * Get button configuration for a given state
 */
export function getButtonConfig(
  state: SessionState,
  sessionId: string
): SessionButtonConfig {
  const configs: Record<SessionState, SessionButtonConfig> = {
    awaiting_checkin: {
      text: 'Start Pre-Training Check-in',
      href: `/dashboard/athlete/sessions/${sessionId}/checkin`,
      description: 'Check-in available 1 hour before session',
      disabled: true,
      icon: 'clock',
      variant: 'disabled',
    },
    checkin_available: {
      text: 'Start Pre-Training Check-in',
      href: `/dashboard/athlete/sessions/${sessionId}/checkin`,
      description: 'Complete your pre-training check-in',
      disabled: false,
      icon: 'check',
      variant: 'primary',
    },
    checkin_completed: {
      text: 'Review Check-in',
      href: `/dashboard/athlete/sessions/${sessionId}/checkin`,
      description: 'Check-in completed. You can review or update before session starts.',
      disabled: false,
      icon: 'check',
      variant: 'secondary',
    },
    training_available: {
      text: 'Start Training',
      href: `/dashboard/athlete/sessions/${sessionId}/training`,
      description: 'Ready to start training',
      disabled: false,
      icon: 'rocket',
      variant: 'primary',
    },
    training_active: {
      text: 'Continue Training',
      href: `/dashboard/athlete/sessions/${sessionId}/training`,
      description: 'Training in progress',
      disabled: false,
      icon: 'rocket',
      variant: 'primary',
    },
    reflection_available: {
      text: 'Complete Reflection',
      href: `/dashboard/athlete/sessions/${sessionId}/reflection`,
      description: 'Session complete - add your reflection',
      disabled: false,
      icon: 'check',
      variant: 'primary',
    },
    completed: {
      text: 'View Reflection',
      href: `/dashboard/athlete/sessions/${sessionId}/reflection`,
      description: 'Session completed',
      disabled: false,
      icon: 'eye',
      variant: 'secondary',
    },
    absent: {
      text: 'Marked Absent',
      href: '#',
      description: 'This session was marked as absent',
      disabled: true,
      icon: 'x',
      variant: 'disabled',
    },
    overdue: {
      text: 'Session Overdue',
      href: '#',
      description: 'Session time has passed',
      disabled: true,
      icon: 'clock',
      variant: 'warning',
    },
  }

  return configs[state]
}
