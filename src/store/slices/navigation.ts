/**
 * Zustand Store - Navigation Slice
 * Manages navigation state (sidebar, mobile menu, etc.)
 */

import { create } from 'zustand'

interface NavigationState {
  // Sidebar state
  isSidebarOpen: boolean
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Mobile menu state
  isMobileMenuOpen: boolean
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void

  // Current section (for contextual sidebar content)
  currentSection: string | null
  setCurrentSection: (section: string | null) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  // Sidebar
  isSidebarOpen: true,
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  // Mobile menu
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

  // Current section
  currentSection: null,
  setCurrentSection: (section) => set({ currentSection: section }),
}))
