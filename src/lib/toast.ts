/**
 * Standardized Toast API
 * Wrapper around Sonner with consistent patterns
 */

import { toast as sonnerToast, type ExternalToast } from 'sonner'

interface ToastOptions extends ExternalToast {
  description?: string
}

/**
 * Standardized toast API for AthleteMind
 * Provides consistent toast notifications throughout the app
 */
export const toast = {
  /**
   * Success toast - Use for successful operations
   */
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: 4000,
      ...options,
    })
  },

  /**
   * Error toast - Use for failed operations
   */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: 6000,
      ...options,
    })
  },

  /**
   * Info toast - Use for informational messages
   */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: 4000,
      ...options,
    })
  },

  /**
   * Warning toast - Use for warnings
   */
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      duration: 5000,
      ...options,
    })
  },

  /**
   * Loading toast - Use for async operations
   * Returns toast ID to dismiss or update later
   */
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, options)
  },

  /**
   * Promise toast - Automatically handles promise states
   */
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, options)
  },

  /**
   * Achievement toast - Special toast for achievements with star animation
   */
  achievement: (title: string, stars: number, options?: ToastOptions) => {
    return sonnerToast.success(title, {
      description: `⭐ +${stars} star${stars > 1 ? 's' : ''} earned!`,
      duration: 6000,
      icon: '🎉',
      ...options,
    })
  },

  /**
   * Reward toast - For reward claiming
   */
  reward: (rewardName: string, options?: ToastOptions) => {
    return sonnerToast.success(`Reward Claimed!`, {
      description: rewardName,
      duration: 5000,
      icon: '🎁',
      ...options,
    })
  },

  /**
   * Streak toast - For streak milestones
   */
  streak: (days: number, options?: ToastOptions) => {
    return sonnerToast.success(`${days}-Day Streak!`, {
      description: `Keep up the amazing work!`,
      duration: 5000,
      icon: '🔥',
      ...options,
    })
  },

  /**
   * Dismiss a toast by ID
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },

  /**
   * Custom toast - For special cases
   */
  custom: (jsx: (id: number | string) => React.ReactElement) => {
    return sonnerToast.custom(jsx)
  },
}
