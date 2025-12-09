import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Only show partial values for security
  const maskKey = (key: string | undefined) => {
    if (!key) return 'NOT_SET'
    if (key.length < 20) return 'TOO_SHORT'
    return `${key.substring(0, 10)}...${key.substring(key.length - 4)}`
  }

  const maskUrl = (url: string | undefined) => {
    if (!url) return 'NOT_SET'
    return url
  }

  // Check both NEXT_PUBLIC_* and ATHLETEMIND_PUBLICSUPABASE_* variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.ATHLETEMIND_PUBLICSUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.ATHLETEMIND_PUBLICSUPABASE_ANON_KEY

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    variablesFound: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ATHLETEMIND_PUBLICSUPABASE_URL: !!process.env.ATHLETEMIND_PUBLICSUPABASE_URL,
      ATHLETEMIND_PUBLICSUPABASE_ANON_KEY: !!process.env.ATHLETEMIND_PUBLICSUPABASE_ANON_KEY,
    },
    usingValues: {
      url: maskUrl(supabaseUrl),
      anonKey: maskKey(supabaseAnonKey),
      urlLength: supabaseUrl?.length || 0,
      anonKeyLength: supabaseAnonKey?.length || 0,
      urlPrefix: supabaseUrl?.substring(0, 30) || 'NONE',
      keyPrefix: supabaseAnonKey?.substring(0, 10) || 'NONE',
    }
  })
}
