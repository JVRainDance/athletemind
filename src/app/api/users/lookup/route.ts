import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { validateUserCodeFormat } from '@/types/connections'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/lookup?code=ATH-XK7M
 * Look up a user by their user code
 * Returns basic profile info for confirmation before sending connection request
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 })
    }

    // Validate code format
    if (!validateUserCodeFormat(code)) {
      return NextResponse.json(
        { error: 'Invalid code format. Expected format: XXX-XXXX (e.g., ATH-XK7M)' },
        { status: 400 }
      )
    }

    // Look up user by code (case-insensitive)
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, user_code')
      .ilike('user_code', code)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found with this code' }, { status: 404 })
    }

    // Don't allow looking up yourself
    if (user.id === session.user.id) {
      return NextResponse.json({ error: 'This is your own code' }, { status: 400 })
    }

    // Return limited info for confirmation
    return NextResponse.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        user_code: user.user_code
      }
    })

  } catch (error) {
    console.error('Error looking up user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
