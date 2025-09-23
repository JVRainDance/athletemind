'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { Mail, CheckCircle, RefreshCw } from 'lucide-react'

export default function ConfirmEmailPage() {
  const [email, setEmail] = useState<string>('')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuthStatus = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setEmail(user.email || '')
        
        // If user is already confirmed, redirect to dashboard
        if (user.email_confirmed_at) {
          router.push('/dashboard')
          return
        }
      }
      
      setIsChecking(false)
    }

    checkAuthStatus()
  }, [router])

  const handleResendConfirmation = async () => {
    if (!email) return
    
    setIsResending(true)
    setResendSuccess(false)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })
      
      if (error) {
        console.error('Error resending confirmation:', error)
        alert('Failed to resend confirmation email. Please try again.')
      } else {
        setResendSuccess(true)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to resend confirmation email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckConfirmation = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.email_confirmed_at) {
        router.push('/dashboard')
      } else {
        alert('Email not confirmed yet. Please check your email and click the confirmation link.')
      }
    } catch (error) {
      console.error('Error checking confirmation:', error)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-primary-600" />
          <span className="text-gray-600">Checking authentication...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Check Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We&apos;ve sent a confirmation link to
          </p>
          <p className="text-sm font-medium text-primary-600">
            {email}
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Almost There!
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Please check your email and click the confirmation link to activate your account.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleCheckConfirmation}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                I&apos;ve Confirmed My Email
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Didn&apos;t receive the email?
                </p>
                <button
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <span className="flex items-center justify-center">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Resending...
                    </span>
                  ) : (
                    'Resend Confirmation Email'
                  )}
                </button>
              </div>

              {resendSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-800">
                    Confirmation email sent! Please check your inbox.
                  </p>
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Check your spam folder if you don&apos;t see the email in your inbox.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/auth/login')}
            className="text-sm text-gray-600 hover:text-gray-500"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
