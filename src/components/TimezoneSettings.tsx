'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useTimezoneDetection } from '@/hooks/useTimezoneDetection'
import { Globe, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface TimezoneSettingsProps {
  currentTimezone: string
  autoDetected: boolean
  onTimezoneUpdate: (timezone: string, autoDetected: boolean) => void
}

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
  'Pacific/Honolulu'
]

export default function TimezoneSettings({ 
  currentTimezone, 
  autoDetected, 
  onTimezoneUpdate 
}: TimezoneSettingsProps) {
  const [selectedTimezone, setSelectedTimezone] = useState(currentTimezone)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const supabase = createClient()

  const { 
    detectedTimezone, 
    loading: detecting, 
    error: detectionError,
    isDetected,
    isFallback 
  } = useTimezoneDetection()

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage({ type: 'error', text: 'Not authenticated. Please log in again.' })
        return
      }

      console.log('Updating timezone:', selectedTimezone, 'for user:', session.user.id)

      const { error } = await supabase
        .from('profiles')
        .update({
          timezone: selectedTimezone,
          timezone_auto_detected: false
        })
        .eq('id', session.user.id)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Timezone updated successfully')
      onTimezoneUpdate(selectedTimezone, false)
      setMessage({ type: 'success', text: 'Timezone updated successfully!' })
    } catch (error) {
      console.error('Error updating timezone:', error)
      setMessage({ type: 'error', text: `Failed to update timezone: ${error.message || 'Unknown error'}` })
    } finally {
      setLoading(false)
    }
  }

  const handleAutoDetect = async () => {
    if (!detectedTimezone) return

    setLoading(true)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage({ type: 'error', text: 'Not authenticated. Please log in again.' })
        return
      }

      console.log('Auto-detecting timezone:', detectedTimezone, 'for user:', session.user.id)

      const { error } = await supabase
        .from('profiles')
        .update({
          timezone: detectedTimezone,
          timezone_auto_detected: true
        })
        .eq('id', session.user.id)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Timezone auto-detected successfully')
      setSelectedTimezone(detectedTimezone)
      onTimezoneUpdate(detectedTimezone, true)
      setMessage({ type: 'success', text: 'Timezone auto-detected and updated!' })
    } catch (error) {
      console.error('Error auto-detecting timezone:', error)
      setMessage({ type: 'error', text: `Failed to auto-detect timezone: ${error.message || 'Unknown error'}` })
    } finally {
      setLoading(false)
    }
  }

  const formatTimezone = (tz: string) => {
    try {
      const now = new Date()
      const offset = new Intl.DateTimeFormat('en', {
        timeZone: tz,
        timeZoneName: 'longOffset'
      }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || ''

      return `${tz} (${offset})`
    } catch {
      return tz
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Globe className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Time Zone
          </h3>
        </div>
        {detectedTimezone && detectedTimezone !== currentTimezone && (
          <button
            onClick={handleAutoDetect}
            disabled={loading || detecting}
            className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
          >
            {detecting ? (
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-1" />
            )}
            Auto-detect
          </button>
        )}
      </div>

      {/* Auto-detection Status */}
      {detectedTimezone && (
        <div className={`p-3 rounded-md ${
          isDetected 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            {isDetected ? (
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
            )}
            <div className="text-sm">
              <p className={`font-medium ${
                isDetected ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {isDetected ? 'Timezone detected from your location' : 'Using browser timezone as fallback'}
              </p>
              <p className={`${
                isDetected ? 'text-green-700' : 'text-yellow-700'
              }`}>
                Detected: {formatTimezone(detectedTimezone)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Timezone Display */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Time Zone
        </label>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-900">
            {formatTimezone(currentTimezone)}
          </span>
          {autoDetected && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Auto-detected
            </span>
          )}
        </div>
      </div>

      {/* Timezone Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Time Zone
        </label>
        <select
          value={selectedTimezone}
          onChange={(e) => setSelectedTimezone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {formatTimezone(tz)}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading || selectedTimezone === currentTimezone}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Timezone'}
        </button>
      </div>
    </div>
  )
}
