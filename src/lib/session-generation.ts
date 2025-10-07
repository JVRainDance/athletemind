import { createClient } from '@/lib/supabase-client'

/**
 * Triggers automatic session generation from training schedules
 * This ensures sessions are always available 7 days ahead
 */
export async function generateSessionsFromSchedules(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // Call the database function to generate sessions
    const { data, error } = await supabase.rpc('generate_sessions_from_schedules')
    
    if (error) {
      console.error('Error generating sessions:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Generates sessions for a specific athlete
 * Useful for when an athlete first sets up their schedule
 */
export async function generateSessionsForAthlete(athleteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get the athlete's training schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('training_schedules')
      .select('*')
      .eq('athlete_id', athleteId)
    
    if (scheduleError) {
      return { success: false, error: scheduleError.message }
    }
    
    if (!schedule || schedule.length === 0) {
      return { success: false, error: 'No training schedule found for this athlete' }
    }
    
    // Generate sessions for the next 7 days
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 7)
    
    const sessions = generateSessionsFromSchedule(schedule, startDate, endDate)
    
    // Insert sessions into database
    const { error: insertError } = await supabase
      .from('training_sessions')
      .insert(sessions.map(session => ({
        ...session,
        athlete_id: athleteId
      })))
    
    if (insertError) {
      return { success: false, error: insertError.message }
    }
    
    // Trigger a custom event to refresh dashboard data
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sessionCreated'))
    }
    
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Utility function to generate sessions from schedule data
 * This is the same function from utils.ts but with proper typing
 */
function generateSessionsFromSchedule(
  schedule: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    session_type: string
  }>,
  startDate: Date,
  endDate: Date
) {
  const sessions: Array<{
    scheduled_date: string
    start_time: string
    end_time: string
    session_type: string
    status: 'scheduled'
  }> = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    const matchingSchedules = schedule.filter(s => s.day_of_week === dayOfWeek)

    // Create a session for each matching schedule on this day
    matchingSchedules.forEach(matchingSchedule => {
      sessions.push({
        scheduled_date: currentDate.toISOString().split('T')[0],
        start_time: matchingSchedule.start_time,
        end_time: matchingSchedule.end_time,
        session_type: matchingSchedule.session_type,
        status: 'scheduled' as const,
      })
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return sessions
}





