import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRoleRedirectPath } from '@/lib/navigation'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
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
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          response.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  // Refresh session if expired
  await supabase.auth.getSession()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log('Middleware: Path:', request.nextUrl.pathname, 'Session:', !!session)

  // If user is not signed in and the current path is protected, redirect to login
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('Middleware: Redirecting to login - no session found')
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If user is signed in and trying to access auth pages, redirect to dashboard
  // But allow access to /auth/loading page and /auth/register (for new users)
  if (session && request.nextUrl.pathname.startsWith('/auth') && 
      !request.nextUrl.pathname.startsWith('/auth/loading') && 
      !request.nextUrl.pathname.startsWith('/auth/register')) {
    // Get user profile to determine role-based redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const redirectPath = getRoleRedirectPath(profile?.role || '')
    return NextResponse.redirect(new URL(redirectPath, request.url))
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
