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
      // Check if profile exists (should be created by trigger, but handle edge cases)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        // Profile exists, redirect based on role
        let redirectPath = '/dashboard'
        if (profile.role === 'athlete') {
          redirectPath = '/dashboard/athlete'
        } else if (profile.role === 'coach') {
          redirectPath = '/dashboard/coach'
        }
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else {
        // Profile doesn't exist (edge case), redirect to login
        return NextResponse.redirect(`${origin}/auth/login`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
