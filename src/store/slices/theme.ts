/**
 * Zustand Store - Theme Slice
 * Manages theme state with persistence
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ThemeName } from '@/lib/design-system/colors'

interface ThemeState {
  currentTheme: ThemeName
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
}

const themes: ThemeName[] = ['professional', 'zelda', 'mario', 'pokemon']

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: 'professional',

      setTheme: (theme: ThemeName) => {
        set({ currentTheme: theme })

        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme)
        }
      },

      toggleTheme: () => {
        const currentIndex = themes.indexOf(get().currentTheme)
        const nextIndex = (currentIndex + 1) % themes.length
        const nextTheme = themes[nextIndex]
        get().setTheme(nextTheme)
      },
    }),
    {
      name: 'athletemind-theme',
      storage: createJSONStorage(() => localStorage),
      // Rehydrate theme on mount
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.currentTheme)
        }
      },
    }
  )
)
