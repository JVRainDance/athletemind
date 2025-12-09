'use client'

import { useState, useCallback } from 'react'

interface UseApiOptions {
  retries?: number
  retryDelay?: number
  onError?: (error: Error) => void
}

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const { retries = 3, retryDelay = 1000, onError } = options

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const execute = useCallback(
    async (
      fetchFn: () => Promise<T>,
      customOptions?: { retries?: number; retryDelay?: number }
    ): Promise<T | null> => {
      setState({ data: null, loading: true, error: null })

      const maxRetries = customOptions?.retries ?? retries
      const delay = customOptions?.retryDelay ?? retryDelay

      let lastError: Error | null = null

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await fetchFn()
          setState({ data: result, loading: false, error: null })
          return result
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('An unknown error occurred')
          console.error(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError)

          // Don't retry on the last attempt
          if (attempt < maxRetries) {
            await sleep(delay * (attempt + 1)) // Exponential backoff
          }
        }
      }

      // All retries failed
      setState({ data: null, loading: false, error: lastError })
      onError?.(lastError!)
      return null
    },
    [retries, retryDelay, onError]
  )

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

// Specialized hook for fetch requests
export function useFetch<T = any>(options: UseApiOptions = {}) {
  const api = useApi<T>(options)

  const fetchData = useCallback(
    async (url: string, init?: RequestInit) => {
      return api.execute(async () => {
        const response = await fetch(url, init)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        return response.json()
      })
    },
    [api]
  )

  return {
    ...api,
    fetchData,
  }
}

// Helper function to check if error is network-related
export function isNetworkError(error: Error): boolean {
  return (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError') ||
    error.message.includes('ERR_INTERNET_DISCONNECTED')
  )
}

// Helper to determine if we should retry
export function shouldRetry(error: Error, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false

  // Retry on network errors
  if (isNetworkError(error)) return true

  // Retry on 5xx server errors
  if (error.message.includes('status: 5')) return true

  // Retry on timeout errors
  if (error.message.includes('timeout')) return true

  // Don't retry on 4xx client errors
  if (error.message.includes('status: 4')) return false

  // Default: retry
  return true
}
