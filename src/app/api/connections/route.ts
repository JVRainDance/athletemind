import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { validateUserCodeFormat, getRoleFromPrefix, extractPrefix } from '@/types/connections'

export const dynamic = 'force-dynamic'

/**
 * GET /api/connections
 * Fetch user's connections with optional filters
 * Query params:
 * - status: 'pending' | 'active' | 'rejected' | 'inactive'
 * - role: 'coach' | 'athlete' (filter by user's role in the connection)
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = searchParams.get('role')

    // Build query with joined profile data
    let query = supabase
      .from('coach_athletes')
      .select(`
        *,
        coach:profiles!coach_athletes_coach_id_fkey(id, first_name, last_name, email, user_code, role),
        athlete:profiles!coach_athletes_athlete_id_fkey(id, first_name, last_name, email, user_code, role)
      `)

    // Filter by user's role in the connection
    if (role === 'coach') {
      query = query.eq('coach_id', session.user.id)
    } else if (role === 'athlete') {
      query = query.eq('athlete_id', session.user.id)
    } else {
      // Get all connections where user is either coach or athlete
      query = query.or(`coach_id.eq.${session.user.id},athlete_id.eq.${session.user.id}`)
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: connections, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching connections:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ connections: connections || [] })

  } catch (error) {
    console.error('Error in connections GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/connections
 * Create a new connection request
 * Body: { userCode: string, message?: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userCode, message } = body

    if (!userCode) {
      return NextResponse.json({ error: 'User code is required' }, { status: 400 })
    }

    // Validate code format
    if (!validateUserCodeFormat(userCode)) {
      return NextResponse.json(
        { error: 'Invalid user code format. Expected format: XXX-XXXX (e.g., ATH-XK7M)' },
        { status: 400 }
      )
    }

    // Find the target user by code
    const { data: targetUser, error: lookupError } = await supabase
      .from('profiles')
      .select('id, role, first_name, last_name, user_code')
      .ilike('user_code', userCode)
      .single()

    if (lookupError || !targetUser) {
      return NextResponse.json({ error: 'User not found with this code' }, { status: 404 })
    }

    // Don't allow connecting to yourself
    if (targetUser.id === session.user.id) {
      return NextResponse.json({ error: 'You cannot connect with yourself' }, { status: 400 })
    }

    // Get current user's profile
    const { data: currentUser, error: profileError } = await supabase
      .from('profiles')
      .select('role, first_name')
      .eq('id', session.user.id)
      .single()

    if (profileError || !currentUser) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Validate the connection type makes sense
    const isCoachConnectingAthlete = currentUser.role === 'coach' && targetUser.role === 'athlete'
    const isAthleteConnectingCoach = currentUser.role === 'athlete' && targetUser.role === 'coach'

    if (!isCoachConnectingAthlete && !isAthleteConnectingCoach) {
      return NextResponse.json({
        error: 'Invalid connection: Coaches can only connect with athletes and vice versa'
      }, { status: 400 })
    }

    // Determine coach_id and athlete_id based on roles
    const coach_id = currentUser.role === 'coach' ? session.user.id : targetUser.id
    const athlete_id = currentUser.role === 'athlete' ? session.user.id : targetUser.id

    // Check for existing pending or active connection
    const { data: existing, error: existingError } = await supabase
      .from('coach_athletes')
      .select('id, status')
      .eq('coach_id', coach_id)
      .eq('athlete_id', athlete_id)
      .in('status', ['pending', 'active'])
      .maybeSingle()

    if (existing) {
      const message = existing.status === 'active'
        ? 'You are already connected with this user'
        : 'A pending connection request already exists'
      return NextResponse.json({ error: message }, { status: 409 })
    }

    // Create the connection request
    const { data: connection, error: createError } = await supabase
      .from('coach_athletes')
      .insert({
        coach_id,
        athlete_id,
        status: 'pending',
        initiated_by: session.user.id,
        request_message: message || null,
        is_active: false // Not active until approved
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating connection:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      connection,
      message: `Connection request sent to ${targetUser.first_name}`
    })

  } catch (error) {
    console.error('Error in connections POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
