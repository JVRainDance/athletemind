/**
 * Vercel Cron Job: Generate Training Sessions & Maintenance
 * Runs daily at midnight to:
 * 1. Mark overdue sessions as absent
 * 2. Generate sessions for the next 7 days
 * 3. Clean up old completed/absent sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase admin client
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Step 1: Mark overdue sessions as absent
    // This runs first so we don't have stale scheduled sessions accumulating
    let overdueCount = 0
    const { data: overdueResult, error: overdueError } = await supabase.rpc('mark_overdue_sessions_absent')

    if (overdueError) {
      console.warn('Error marking overdue sessions:', overdueError)
      // Don't fail the request if this fails
    } else if (overdueResult && overdueResult.length > 0) {
      overdueCount = overdueResult[0]?.updated_count || 0
      if (overdueCount > 0) {
        console.log(`Marked ${overdueCount} overdue sessions as absent`)
      }
    }

    // Step 2: Generate new sessions for the next 7 days
    const { error } = await supabase.rpc('generate_sessions_from_schedules')

    if (error) {
      console.error('Error generating sessions:', error)
      return NextResponse.json(
        { error: 'Failed to generate sessions', details: error.message },
        { status: 500 }
      )
    }

    // Step 3: Clean up old sessions (30+ days old)
    const { error: cleanupError } = await supabase.rpc('cleanup_old_sessions')

    if (cleanupError) {
      console.warn('Error cleaning up old sessions:', cleanupError)
      // Don't fail the request if cleanup fails
    }

    return NextResponse.json({
      success: true,
      message: 'Session maintenance completed successfully',
      overdueSessionsMarked: overdueCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
