import { NextResponse } from 'next/server'
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env'

export const dynamic = 'force-dynamic'

// This endpoint provides public Supabase configuration to the client
// since ATHLETEMIND_PUBLICSUPABASE_* variables aren't accessible in the browser
export async function GET() {
  try {
    return NextResponse.json({
      supabaseUrl: getSupabaseUrl(),
      supabaseAnonKey: getSupabaseAnonKey(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
