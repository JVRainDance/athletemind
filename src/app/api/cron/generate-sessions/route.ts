/**
 * Vercel Cron Job: Generate Training Sessions
 * Runs daily at midnight to generate sessions for the next 7 days
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

    // Call the database function to generate sessions
    const { error } = await supabase.rpc('generate_sessions_from_schedules')

    if (error) {
      console.error('Error generating sessions:', error)
      return NextResponse.json(
        { error: 'Failed to generate sessions', details: error.message },
        { status: 500 }
      )
    }

    // Optional: Also run cleanup of old sessions
    const { error: cleanupError } = await supabase.rpc('cleanup_old_sessions')

    if (cleanupError) {
      console.warn('Error cleaning up old sessions:', cleanupError)
      // Don't fail the request if cleanup fails
    }

    return NextResponse.json({
      success: true,
      message: 'Sessions generated successfully',
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
