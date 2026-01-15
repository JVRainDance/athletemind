'use client'

import { useState } from 'react'
import { UserPlus, Loader2, Search, X } from 'lucide-react'
import { toast } from '@/lib/toast'
import { getFullName } from '@/lib/utils'
import { validateUserCodeFormat, getUserCodePrefix } from '@/types/connections'

interface AddByCodeInputProps {
  expectedRole: 'athlete' | 'coach'
  onSuccess?: () => void
  placeholder?: string
  className?: string
}

interface LookupResult {
  id: string
  first_name: string
  last_name: string | null
  role: 'athlete' | 'coach' | 'parent'
  user_code: string
}

export function AddByCodeInput({
  expectedRole,
  onSuccess,
  placeholder,
  className = ''
}: AddByCodeInputProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [sending, setSending] = useState(false)

  const expectedPrefix = getUserCodePrefix(expectedRole)
  const defaultPlaceholder = placeholder || `Enter ${expectedRole} code (e.g., ${expectedPrefix}-XK7M)`

  const handleLookup = async () => {
    const trimmedCode = code.trim().toUpperCase()

    if (!trimmedCode) {
      toast.error('Please enter a code')
      return
    }

    // Validate format
    if (!validateUserCodeFormat(trimmedCode)) {
      toast.error('Invalid code format. Expected format: XXX-XXXX (e.g., ATH-XK7M)')
      return
    }

    // Check prefix matches expected role
    const prefix = trimmedCode.substring(0, 3)
    if (prefix !== expectedPrefix) {
      toast.error(`Please enter an ${expectedRole} code (starting with ${expectedPrefix})`)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/users/lookup?code=${encodeURIComponent(trimmedCode)}`)
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'User not found')
        return
      }

      setLookupResult(data.user)
      setShowConfirmDialog(true)
    } catch (error) {
      toast.error('Failed to look up user')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async () => {
    if (!lookupResult) return

    setSending(true)
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCode: code.trim().toUpperCase() })
      })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to send request')
        return
      }

      toast.success(data.message || 'Connection request sent!')
      setCode('')
      setLookupResult(null)
      setShowConfirmDialog(false)
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to send connection request')
    } finally {
      setSending(false)
    }
  }

  const handleCancel = () => {
    setShowConfirmDialog(false)
    setLookupResult(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup()
    }
  }

  return (
    <>
      <div className={`flex gap-2 ${className}`}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          placeholder={defaultPlaceholder}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          maxLength={8}
        />
        <button
          onClick={handleLookup}
          disabled={loading || !code.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && lookupResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Send Connection Request
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                Confirm you want to connect with this {expectedRole}
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="font-medium text-gray-900 text-lg">
                  {getFullName(lookupResult.first_name, lookupResult.last_name)}
                </p>
                <p className="text-sm text-gray-500 mt-1 capitalize">
                  {lookupResult.role}
                </p>
                <code className="text-xs text-primary-600 font-mono mt-2 block">
                  {lookupResult.user_code}
                </code>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendRequest}
                  disabled={sending}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AddByCodeInput
