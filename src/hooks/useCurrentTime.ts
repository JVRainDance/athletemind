/**
 * useCurrentTime Hook
 * Returns current time and updates every minute
 */

'use client'

import { useState, useEffect } from 'react'

/**
 * Hook that returns current time and updates every minute
 * Useful for time-sensitive UI elements like countdowns and session states
 */
export function useCurrentTime(updateInterval: number = 60000): Date {
  const [currentTime, setCurrentTime] = useState(() => new Date())

  useEffect(() => {
    // Update immediately on mount
    setCurrentTime(new Date())

    // Set up interval to update every minute (or custom interval)
    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, updateInterval)

    return () => clearInterval(intervalId)
  }, [updateInterval])

  return currentTime
}
