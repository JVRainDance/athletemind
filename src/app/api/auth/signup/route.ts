import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, role } = await request.json()

    // Validate inputs
    if (!email || !password || !firstName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Sign up the user with metadata for profile creation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.headers.get('origin')}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName || null,
          role: role
        }
      }
    })

    if (authError) {
      console.error('Registration error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (authData.user) {
      console.log('User created:', authData.user.id)

      // Check if email confirmation is required
      if (authData.user.identities && authData.user.identities.length === 0) {
        // User already exists
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
        }
      })
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  } catch (err: any) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: err?.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
