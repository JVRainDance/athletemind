import { Database } from './database'

export type ConnectionStatus = Database['public']['Enums']['connection_status']

export interface UserProfile {
  id: string
  first_name: string
  last_name: string | null
  email: string
  user_code: string
  role: 'athlete' | 'coach' | 'parent'
}

export interface ConnectionRequest {
  id: string
  coach_id: string
  athlete_id: string
  status: ConnectionStatus
  initiated_by: string | null
  request_message: string | null
  created_at: string | null
  assigned_at: string | null
  responded_at: string | null
  is_active: boolean | null
  // Joined profile data
  coach?: UserProfile
  athlete?: UserProfile
}

export interface UserCodeLookupResult {
  id: string
  first_name: string
  last_name: string | null
  role: 'athlete' | 'coach' | 'parent'
  user_code: string
}

export type UserCodePrefix = 'ATH' | 'COA' | 'PAR'

/**
 * Get the expected user code prefix for a given role
 */
export function getUserCodePrefix(role: 'athlete' | 'coach' | 'parent'): UserCodePrefix {
  switch (role) {
    case 'athlete': return 'ATH'
    case 'coach': return 'COA'
    case 'parent': return 'PAR'
  }
}

/**
 * Get the role from a user code prefix
 */
export function getRoleFromPrefix(prefix: string): 'athlete' | 'coach' | 'parent' | null {
  switch (prefix.toUpperCase()) {
    case 'ATH': return 'athlete'
    case 'COA': return 'coach'
    case 'PAR': return 'parent'
    default: return null
  }
}

/**
 * Validate user code format
 * Valid format: XXX-XXXX where XXX is ATH/COA/PAR and XXXX is alphanumeric
 * Excludes confusing characters: O, 0, I, 1, L
 */
export function validateUserCodeFormat(code: string): boolean {
  const pattern = /^(ATH|COA|PAR)-[A-HJ-NP-Z2-9]{4}$/i
  return pattern.test(code)
}

/**
 * Format a user code for display (uppercase)
 */
export function formatUserCode(code: string): string {
  return code.toUpperCase()
}

/**
 * Extract the prefix from a user code
 */
export function extractPrefix(code: string): UserCodePrefix | null {
  const match = code.toUpperCase().match(/^(ATH|COA|PAR)-/)
  return match ? (match[1] as UserCodePrefix) : null
}
