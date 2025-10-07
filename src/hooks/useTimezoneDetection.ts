import { useState, useEffect } from 'react'

interface TimezoneData {
  timezone: string
  detected: boolean
  fallback: boolean
  error?: string
}

export function useTimezoneDetection() {
  const [timezoneData, setTimezoneData] = useState<TimezoneData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const detectTimezone = async () => {
      try {
        setLoading(true)
        setError(null)

        // First try to get timezone from IP
        const response = await fetch('/api/detect-timezone')
        
        if (!response.ok) {
          throw new Error('Failed to detect timezone')
        }

        const data = await response.json()
        setTimezoneData(data)
      } catch (err) {
        console.error('Error detecting timezone:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        
        // Fallback to browser timezone
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        setTimezoneData({
          timezone: browserTimezone,
          detected: false,
          fallback: true,
          error: 'Failed to detect timezone from IP'
        })
      } finally {
        setLoading(false)
      }
    }

    detectTimezone()
  }, [])

  return {
    timezoneData,
    loading,
    error,
    detectedTimezone: timezoneData?.timezone,
    isDetected: timezoneData?.detected,
    isFallback: timezoneData?.fallback
  }
}
