import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern to ensure we only create one client instance
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (clientInstance) {
    return clientInstance
  }

  // For client-side usage, check both ATHLETEMIND_PUBLIC_ and NEXT_PUBLIC_ prefixes
  // These are the only prefixes that Next.js exposes to the browser
  const supabaseUrl =
    process.env.ATHLETEMIND_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''

  const supabaseAnonKey =
    process.env.ATHLETEMIND_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'ATHLETEMIND_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and ' +
      'ATHLETEMIND_PUBLIC_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. ' +
      'Check your .env.local file or Vercel environment variables.'
    )
  }

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return clientInstance
}
