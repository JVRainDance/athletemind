import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set(name, value)
          },
          remove(name: string, options: any) {
            request.cookies.set(name, '')
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        // Profile doesn't exist, this is a new user after email confirmation
        // Create profile automatically with default values
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            first_name: 'User', // Default values
            last_name: null,
            role: 'athlete', // Default to athlete
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          // Redirect to login with error message
          return NextResponse.redirect(`${origin}/auth/login?error=profile_creation_failed`)
        }

        // Generate sessions for new athletes
        try {
          const { generateSessionsForAthlete } = await import('@/lib/session-generation')
          await generateSessionsForAthlete(data.user.id)
          console.log('Sessions generated for new athlete')
        } catch (error) {
          console.error('Error generating sessions for new athlete:', error)
          // Don't block registration if session generation fails
        }

        // Redirect to login page with success message
        return NextResponse.redirect(`${origin}/auth/login?message=profile_created`)
      } else {
        // Profile exists, redirect to login page
        return NextResponse.redirect(`${origin}/auth/login?message=already_confirmed`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
