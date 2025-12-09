import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern to ensure we only create one client instance
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (clientInstance) {
    return clientInstance
  }

  // Hardcoded Supabase configuration
  // These are public values (URL and anon key) that are safe to expose client-side
  // They are protected by Row Level Security (RLS) policies in the database
  const supabaseUrl = 'https://ggkskiecojaxqaradnbm.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdna3NraWVjb2pheHFhcmFkbmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjkyMDEsImV4cCI6MjA4MDYwNTIwMX0.INOjOta0a6fBDKepsxixXqXDfIU26leEjydH7ho-Ylg'

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return clientInstance
}
