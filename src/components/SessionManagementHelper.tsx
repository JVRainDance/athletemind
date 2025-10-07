'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface SessionManagementHelperProps {
  sessionId: string
  onUpdated: () => void
}

export default function SessionManagementHelper({ sessionId, onUpdated }: SessionManagementHelperProps) {
  const [loading, setLoading] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const handleMarkAbsent = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('training_sessions')
        .update({ 
          status: 'absent',
          absence_reason: 'Session time has passed'
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Error marking absent:', error)
        alert('Error marking session as absent. Please try again.')
      } else {
        onUpdated()
        setShowOptions(false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkCompleted = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('training_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId)

      if (error) {
        console.error('Error marking completed:', error)
        alert('Error marking session as completed. Please try again.')
      } else {
        onUpdated()
        setShowOptions(false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (!showOptions) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Session Time Has Passed
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              This session's time has already passed. You can mark it as absent or completed.
            </p>
            <button
              onClick={() => setShowOptions(true)}
              className="mt-2 text-sm text-yellow-800 hover:text-yellow-900 underline"
            >
              Manage this session
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Session Time Has Passed
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              How would you like to handle this session?
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleMarkAbsent}
            disabled={loading}
            className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Mark Absent
          </button>
          <button
            onClick={handleMarkCompleted}
            disabled={loading}
            className="inline-flex items-center px-3 py-1 border border-green-300 text-xs font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Mark Completed
          </button>
          <button
            onClick={() => setShowOptions(false)}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-gray-50 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

