import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRoleRedirectPath } from '@/lib/navigation'

export async function middleware(request: NextRequest) {
  // Skip middleware during build time
  if (process.env.NODE_ENV === 'production' && !request.headers.get('user-agent')) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  // Use ATHLETEMIND_PUBLICSUPABASE_* variables that are set in Vercel
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.ATHLETEMIND_PUBLICSUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.ATHLETEMIND_PUBLICSUPABASE_ANON_KEY

  // Only create Supabase client if we have the required environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          response.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  try {
    // Refresh session if expired
    await supabase.auth.getSession()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If user is not signed in and the current path is protected, redirect to login
    if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Check if user is confirmed
    if (session && !session.user.email_confirmed_at && 
        !request.nextUrl.pathname.startsWith('/auth/confirm-email') &&
        !request.nextUrl.pathname.startsWith('/auth/loading')) {
      return NextResponse.redirect(new URL('/auth/confirm-email', request.url))
    }

    // If user is signed in and trying to access auth pages, redirect to dashboard
    // But allow access to /auth/loading page, /auth/register, and /auth/confirm-email
    if (session && request.nextUrl.pathname.startsWith('/auth') && 
        !request.nextUrl.pathname.startsWith('/auth/loading') && 
        !request.nextUrl.pathname.startsWith('/auth/register') &&
        !request.nextUrl.pathname.startsWith('/auth/confirm-email')) {
      
      // Check if profile exists, create if it doesn't
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile && profileError?.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating profile for user:', session.user.id, 'with metadata:', session.user.user_metadata)
        try {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              first_name: session.user.user_metadata?.first_name || 'User',
              last_name: session.user.user_metadata?.last_name || null,
              role: session.user.user_metadata?.role || 'athlete'
            })

          if (!insertError) {
            console.log('Profile created successfully for user:', session.user.id)
            // Profile created successfully, redirect based on role
            const role = session.user.user_metadata?.role || 'athlete'
            const redirectPath = getRoleRedirectPath(role)
            return NextResponse.redirect(new URL(redirectPath, request.url))
          } else {
            console.error('Failed to create profile:', insertError)
          }
        } catch (err) {
          console.error('Failed to create profile in middleware:', err)
        }
      }

      // If profile exists or creation failed, redirect based on role
      const redirectPath = getRoleRedirectPath(profile?.role || 'athlete')
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  } catch (error) {
    // If there's an error (e.g., during build), just continue
    console.log('Middleware error:', error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
