/**
 * Zustand Store - Notifications Slice
 * Manages in-app notifications state
 */

import { create } from 'zustand'

export interface Notification {
  id: string
  type: 'session_reminder' | 'achievement' | 'coach_message' | 'reward_available' | 'streak_milestone' | 'info'
  title: string
  message: string
  read: boolean
  action_url?: string
  created_at: string
}

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean

  // Actions
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  setLoading: (loading: boolean) => void
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: !notification.read ? state.unreadCount + 1 : state.unreadCount,
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount:
          notification && !notification.read
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
      }
    }),

  clearAll: () =>
    set({
      notifications: [],
      unreadCount: 0,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
}))
