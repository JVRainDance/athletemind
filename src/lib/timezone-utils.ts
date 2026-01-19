/**
 * Utility functions for timezone handling
 */

export function formatTimezoneDisplay(timezone: string): string {
  try {
    const now = new Date()
    const offset = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || ''

    return `${timezone} (${offset})`
  } catch {
    return timezone
  }
}

export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date()
    const offset = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || ''

    return offset
  } catch {
    return 'Unknown'
  }
}

export function convertToUserTimezone(date: Date, userTimezone: string): Date {
  try {
    // Create a new date in the user's timezone
    const userDate = new Date(date.toLocaleString('en-US', { timeZone: userTimezone }))
    return userDate
  } catch {
    return date
  }
}

export function formatDateInTimezone(date: Date | string, timezone: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    // Handle string dates (YYYY-MM-DD format from database)
    // Parse as local date to avoid timezone shift issues
    const dateObj = typeof date === 'string'
      ? new Date(date + 'T00:00:00')
      : date
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      ...options
    }).format(dateObj)
  } catch {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString()
  }
}

export function formatTimeInTimezone(date: Date, timezone: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...options
    }).format(date)
  } catch {
    return date.toLocaleTimeString()
  }
}

export function getCommonTimezones(): Array<{ value: string; label: string }> {
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Perth',
    'Pacific/Auckland',
    'Pacific/Honolulu'
  ]

  return timezones.map(tz => ({
    value: tz,
    label: formatTimezoneDisplay(tz)
  }))
}
