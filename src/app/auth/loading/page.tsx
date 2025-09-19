'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthLoadingPage() {
  const [status, setStatus] = useState('Establishing session...')
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        setStatus('Checking authentication...')
        console.log('Loading page: Checking session...')
        
        // Wait a moment for session to be established
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Loading page: Session result:', { session: !!session, error })
        
        if (error) {
          console.error('Session error:', error)
          setStatus('Authentication error, redirecting to login...')
          setTimeout(() => router.push('/auth/login'), 1000)
          return
        }

        if (!session) {
          console.log('No session found, redirecting to login...')
          setStatus('No session found, redirecting to login...')
          setTimeout(() => router.push('/auth/login'), 1000)
          return
        }

        setStatus('Getting user profile...')
        
        // Get user profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Profile error:', profileError)
          setStatus('Profile error, redirecting to dashboard...')
          setTimeout(() => router.push('/dashboard'), 1000)
          return
        }

        setStatus('Redirecting to dashboard...')
        
        // Redirect based on role
        if (profile?.role === 'athlete') {
          setTimeout(() => router.push('/dashboard/athlete'), 500)
        } else if (profile?.role === 'coach') {
          setTimeout(() => router.push('/dashboard/coach'), 500)
        } else {
          setTimeout(() => router.push('/dashboard'), 500)
        }
        
      } catch (err) {
        console.error('Unexpected error:', err)
        setStatus('Error occurred, redirecting to login...')
        setTimeout(() => router.push('/auth/login'), 1000)
      }
    }

    checkSession()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            AthleteMind
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {status}
          </p>
        </div>
      </div>
    </div>
  )
}
