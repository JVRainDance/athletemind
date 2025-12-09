'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

export default function CompleteProfilePage() {
  const [status, setStatus] = useState('Creating your profile...')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const completeProfile = async () => {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('No user found. Please try logging in again.')
          setIsLoading(false)
          return
        }

        setStatus('Getting your registration details...')

        // Get pending profile data from localStorage
        const pendingProfile = localStorage.getItem('pendingProfile')
        if (!pendingProfile) {
          setError('No registration data found. Please register again.')
          setIsLoading(false)
          return
        }

        const { firstName, lastName, role } = JSON.parse(pendingProfile)
        
        setStatus('Creating your profile...')

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            first_name: firstName,
            last_name: lastName || null,
            role,
          } as any)

        if (profileError) {
          console.error('Error creating profile:', profileError)
          setError('Failed to create profile. Please try registering again.')
          setIsLoading(false)
          return
        }

        setStatus('Setting up your account...')

        // Clear pending profile data
        localStorage.removeItem('pendingProfile')

        // Generate sessions for new athletes
        if (role === 'athlete') {
          try {
            const { generateSessionsForAthlete } = await import('@/lib/session-generation')
            await generateSessionsForAthlete(user.id)
            console.log('Sessions generated for new athlete')
          } catch (error) {
            console.error('Error generating sessions for new athlete:', error)
            // Don't block registration if session generation fails
          }
        }

        setStatus('Welcome to AthleteMind!')

        // Redirect to appropriate dashboard after a short delay
        setTimeout(() => {
          if (role === 'athlete') {
            router.push('/dashboard/athlete')
          } else if (role === 'coach') {
            router.push('/dashboard/coach')
          } else {
            router.push('/dashboard')
          }
        }, 2000)

      } catch (error) {
        console.error('Error completing profile:', error)
        setError('An unexpected error occurred. Please try again.')
        setIsLoading(false)
      }
    }

    completeProfile()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Creation Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/auth/register')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {isLoading ? (
          <>
            <RefreshCw className="mx-auto h-16 w-16 text-blue-500 animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Setting Up Your Account</h1>
            <p className="text-gray-600 mb-6">{status}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to AthleteMind!</h1>
            <p className="text-gray-600 mb-6">Your account is ready. Redirecting you to your dashboard...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
