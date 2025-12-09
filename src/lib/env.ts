// Environment variable configuration
// This file handles the mapping between Vercel's variable names and what the app needs

export const getSupabaseUrl = (): string => {
  // Priority order: ATHLETEMIND_PUBLIC_ (Vercel) -> NEXT_PUBLIC_ (standard) -> fallbacks
  const url =
    process.env.ATHLETEMIND_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.ATHLETEMIND_PUBLICSUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''

  if (!url) {
    throw new Error('Supabase URL not found in environment variables')
  }

  return url
}

export const getSupabaseAnonKey = (): string => {
  // Priority order: ATHLETEMIND_PUBLIC_ (Vercel) -> NEXT_PUBLIC_ (standard) -> fallbacks
  const key =
    process.env.ATHLETEMIND_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.ATHLETEMIND_PUBLICSUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''

  if (!key) {
    throw new Error('Supabase Anon Key not found in environment variables')
  }

  return key
}
