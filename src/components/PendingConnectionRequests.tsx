'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Check, X, Clock, Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { getFullName } from '@/lib/utils'
import { ConnectionRequest } from '@/types/connections'

interface PendingConnectionRequestsProps {
  userRole: 'coach' | 'athlete'
  onUpdate?: () => void
  className?: string
}

export function PendingConnectionRequests({
  userRole,
  onUpdate,
  className = ''
}: PendingConnectionRequestsProps) {
  const [requests, setRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchPendingRequests()
  }, [userRole])

  const fetchPendingRequests = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/connections?status=pending&role=${userRole}`)
      const data = await response.json()

      if (response.ok) {
        // Filter to show only requests where current user is the recipient
        const filtered = data.connections.filter(
          (conn: ConnectionRequest) => conn.initiated_by !== session.user.id
        )
        setRequests(filtered)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (requestId: string, action: 'approve' | 'reject') => {
    setResponding(requestId)
    try {
      const response = await fetch(`/api/connections/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to respond')
        return
      }

      toast.success(data.message)
      await fetchPendingRequests()
      onUpdate?.()
    } catch (error) {
      toast.error('Failed to respond to request')
    } finally {
      setResponding(null)
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg h-24 ${className}`} />
    )
  }

  if (requests.length === 0) {
    return null // Don't show section if no pending requests
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-yellow-600" />
        <h3 className="font-medium text-yellow-800">
          Pending Connection Requests ({requests.length})
        </h3>
      </div>

      <div className="space-y-3">
        {requests.map((request) => {
          const otherUser = userRole === 'coach' ? request.athlete : request.coach

          return (
            <div
              key={request.id}
              className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {otherUser ? getFullName(otherUser.first_name, otherUser.last_name) : 'Unknown User'}
                </p>
                <p className="text-sm text-gray-500">
                  {userRole === 'coach' ? 'Athlete' : 'Coach'} wants to connect
                </p>
                {request.request_message && (
                  <p className="text-sm text-gray-600 mt-1 italic truncate">
                    &ldquo;{request.request_message}&rdquo;
                  </p>
                )}
                {otherUser?.user_code && (
                  <code className="text-xs text-primary-600 font-mono mt-1 block">
                    {otherUser.user_code}
                  </code>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleRespond(request.id, 'reject')}
                  disabled={responding === request.id}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  title="Decline"
                >
                  {responding === request.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleRespond(request.id, 'approve')}
                  disabled={responding === request.id}
                  className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  title="Accept"
                >
                  {responding === request.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PendingConnectionRequests
