'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function TestDashboard() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Test dashboard session:', session)
      setSession(session)
      setLoading(false)
    }

    getSession()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Test Dashboard</h1>
        <p className="text-red-600">No session found</p>
        <a href="/auth/login" className="text-blue-600 underline">Go to Login</a>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Dashboard</h1>
      <p className="text-green-600">Session found!</p>
      <p>User: {session.user.email}</p>
      <p>User ID: {session.user.id}</p>
    </div>
  )
}
