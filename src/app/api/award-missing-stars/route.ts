import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * One-time API endpoint to award stars for completed sessions that don't have stars yet
 * This fixes the issue where sessions were completed before the star-awarding logic was implemented
 *
 * Usage: GET /api/award-missing-stars
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find all completed sessions for this user
    const { data: completedSessions, error: sessionsError } = await supabase
      .from('training_sessions')
      .select('id, athlete_id, scheduled_date')
      .eq('athlete_id', session.user.id)
      .eq('status', 'completed')
      .order('scheduled_date', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    if (!completedSessions || completedSessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No completed sessions found',
        starsAwarded: 0
      })
    }

    // Get existing stars to avoid duplicates
    const { data: existingStars } = await supabase
      .from('user_stars')
      .select('session_id')
      .eq('user_id', session.user.id)

    const existingSessionIds = new Set(existingStars?.map(s => s.session_id) || [])

    // Find sessions that need stars
    const sessionsNeedingStars = completedSessions.filter(
      s => !existingSessionIds.has(s.id)
    )

    if (sessionsNeedingStars.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All completed sessions already have stars!',
        starsAwarded: 0,
        totalCompleted: completedSessions.length
      })
    }

    // Award stars for missing sessions
    const starsToInsert = sessionsNeedingStars.map(session => ({
      user_id: session.athlete_id,
      session_id: session.id,
      stars_earned: 1,
      earned_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabase
      .from('user_stars')
      .insert(starsToInsert)

    if (insertError) {
      console.error('Error inserting stars:', insertError)
      return NextResponse.json(
        { error: 'Failed to award stars' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully awarded ${sessionsNeedingStars.length} star(s)!`,
      starsAwarded: sessionsNeedingStars.length,
      totalCompleted: completedSessions.length,
      sessions: sessionsNeedingStars.map(s => ({
        id: s.id,
        date: s.scheduled_date
      }))
    })

  } catch (error) {
    console.error('Unexpected error in award-missing-stars:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
