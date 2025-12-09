import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern to ensure we only create one client instance
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (clientInstance) {
    return clientInstance
  }

  // Use the Supabase configuration from your Vercel environment
  // These are public values that are safe to use client-side
  const supabaseUrl = 'https://ggkskiecojaxqaradnbm.supabase.co'
  const supabaseAnonKey = process.env.ATHLETEMIND_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdna3NraWVjb2pheHFhcmFkbmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MTA1ODcsImV4cCI6MjA1MjM4NjU4N30.rqSEJ4K8WLnGWJlTT-k7Fq8qGqI6d8_bH4iVNsn-Ylg'

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return clientInstance
}
