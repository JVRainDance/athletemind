import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use ATHLETEMIND_PUBLICSUPABASE_* variables that are set in Vercel
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.ATHLETEMIND_PUBLICSUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.ATHLETEMIND_PUBLICSUPABASE_ANON_KEY!

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
