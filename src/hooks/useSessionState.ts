/**
 * useSessionState Hook
 * React hook wrapper for session state machine
 */

'use client'

import { useMemo } from 'react'
import { getSessionState, getButtonConfig, type SessionState, type SessionButtonConfig } from '@/lib/session-state-machine'
import { useCurrentTime } from './useCurrentTime'

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

interface UseSessionStateReturn {
  state: SessionState
  buttonConfig: SessionButtonConfig
  isOverdue: boolean
  isCompleted: boolean
  canInteract: boolean
}

/**
 * Hook to get current session state and button configuration
 * Updates every minute to handle time-based state changes
 */
export function useSessionState(
  session: Session | null,
  checkin: Checkin | null
): UseSessionStateReturn {
  const currentTime = useCurrentTime()

  return useMemo(() => {
    if (!session) {
      return {
        state: 'awaiting_checkin' as SessionState,
        buttonConfig: {
          text: 'Loading...',
          href: '#',
          description: 'Loading session data',
          disabled: true,
          icon: 'clock' as const,
          variant: 'disabled' as const,
        },
        isOverdue: false,
        isCompleted: false,
        canInteract: false,
      }
    }

    const state = getSessionState(session, checkin, currentTime)
    const buttonConfig = getButtonConfig(state, session.id)

    return {
      state,
      buttonConfig,
      isOverdue: state === 'overdue',
      isCompleted: state === 'completed' || state === 'absent',
      canInteract: !buttonConfig.disabled,
    }
  }, [session, checkin, currentTime])
}
