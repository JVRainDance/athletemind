/**
 * Zustand Store - User Slice
 * Caches user profile data to reduce database queries
 */

import { create } from 'zustand'

interface UserProfile {
  id: string
  email?: string
  full_name: string | null
  role: 'athlete' | 'coach' | 'parent'
  timezone?: string
  theme_preference?: string
  created_at?: string
}

interface UserState {
  profile: UserProfile | null
  isLoading: boolean
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  clearProfile: () => void
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isLoading: true,

  setProfile: (profile) => set({ profile, isLoading: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  updateProfile: (updates) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    })),

  clearProfile: () => set({ profile: null, isLoading: false }),
}))
