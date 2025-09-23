import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Test the session generation function
    const { data, error } = await supabase.rpc('generate_sessions_from_schedules')
    
    if (error) {
      console.error('Error generating sessions:', error)
      return NextResponse.json(
        { error: 'Failed to generate sessions', details: error.message },
        { status: 500 }
      )
    }
    
    // Get count of sessions to verify generation
    const { data: sessionCount, error: countError } = await supabase
      .from('training_sessions')
      .select('id', { count: 'exact' })
    
    if (countError) {
      return NextResponse.json(
        { error: 'Failed to count sessions', details: countError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sessions generated successfully',
      totalSessions: sessionCount?.length || 0
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}



