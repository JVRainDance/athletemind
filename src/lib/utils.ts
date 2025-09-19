import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(time: string) {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function getNextWeekday(dayOfWeek: number): Date {
  const today = new Date()
  const currentDay = today.getDay()
  const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7
  const nextDate = new Date(today)
  nextDate.setDate(today.getDate() + daysUntilTarget)
  return nextDate
}

export function generateSessionsFromSchedule(
  schedule: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    session_type: string
  }>,
  startDate: Date,
  endDate: Date
) {
  const sessions = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    const matchingSchedule = schedule.find(s => s.day_of_week === dayOfWeek)

    if (matchingSchedule) {
      sessions.push({
        scheduled_date: currentDate.toISOString().split('T')[0],
        start_time: matchingSchedule.start_time,
        end_time: matchingSchedule.end_time,
        session_type: matchingSchedule.session_type,
        status: 'scheduled' as const,
      })
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return sessions
}

export function getFullName(firstName: string, lastName?: string | null): string {
  if (!firstName) return 'User'
  if (!lastName) return firstName
  return `${firstName} ${lastName}`
}
