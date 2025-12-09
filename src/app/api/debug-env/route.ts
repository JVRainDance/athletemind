import { NextResponse } from 'next/server'
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Only show partial values for security
  const maskKey = (key: string) => {
    if (key.length < 20) return 'TOO_SHORT'
    return `${key.substring(0, 10)}...${key.substring(key.length - 4)}`
  }

  try {
    const supabaseUrl = getSupabaseUrl()
    const supabaseAnonKey = getSupabaseAnonKey()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      variablesFound: {
        ATHLETEMIND_PUBLIC_SUPABASE_URL: !!process.env.ATHLETEMIND_PUBLIC_SUPABASE_URL,
        ATHLETEMIND_PUBLIC_SUPABASE_ANON_KEY: !!process.env.ATHLETEMIND_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        ATHLETEMIND_PUBLICSUPABASE_URL: !!process.env.ATHLETEMIND_PUBLICSUPABASE_URL,
        ATHLETEMIND_PUBLICSUPABASE_ANON_KEY: !!process.env.ATHLETEMIND_PUBLICSUPABASE_ANON_KEY,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      },
      usingValues: {
        url: supabaseUrl,
        anonKey: maskKey(supabaseAnonKey),
        urlLength: supabaseUrl.length,
        anonKeyLength: supabaseAnonKey.length,
        urlPrefix: supabaseUrl.substring(0, 30),
        keyPrefix: supabaseAnonKey.substring(0, 10),
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      variablesFound: {
        ATHLETEMIND_PUBLIC_SUPABASE_URL: !!process.env.ATHLETEMIND_PUBLIC_SUPABASE_URL,
        ATHLETEMIND_PUBLIC_SUPABASE_ANON_KEY: !!process.env.ATHLETEMIND_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        ATHLETEMIND_PUBLICSUPABASE_URL: !!process.env.ATHLETEMIND_PUBLICSUPABASE_URL,
        ATHLETEMIND_PUBLICSUPABASE_ANON_KEY: !!process.env.ATHLETEMIND_PUBLICSUPABASE_ANON_KEY,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      }
    }, { status: 500 })
  }
}
