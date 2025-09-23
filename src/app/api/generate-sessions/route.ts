import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = createClient()
    
    // Call the database function to generate sessions
    const { data, error } = await supabase.rpc('generate_sessions_from_schedules')
    
    if (error) {
      console.error('Error generating sessions:', error)
      return NextResponse.json(
        { error: 'Failed to generate sessions' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sessions generated successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



