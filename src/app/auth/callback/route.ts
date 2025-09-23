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

      let redirectPath = '/dashboard'

      if (!existingProfile) {
        // Profile doesn't exist, this is a new user after email confirmation
        // We need to get the user data from the registration process
        // For now, redirect to a profile completion page
        return NextResponse.redirect(`${origin}/auth/complete-profile`)
      } else {
        // Profile exists, redirect based on role
        if (existingProfile.role === 'athlete') {
          redirectPath = '/dashboard/athlete'
        } else if (existingProfile.role === 'coach') {
          redirectPath = '/dashboard/coach'
        }
      }

      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
