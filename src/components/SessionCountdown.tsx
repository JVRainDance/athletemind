'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface SessionCountdownProps {
  sessionDate: string
  sessionTime: string
}

export default function SessionCountdown({ sessionDate, sessionTime }: SessionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isLessThan24Hours, setIsLessThan24Hours] = useState(false)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`)
      
      // Check if session is less than 24 hours away
      const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      setIsLessThan24Hours(hoursUntilSession <= 24 && hoursUntilSession > 0)
      
      if (hoursUntilSession <= 0) {
        setTimeLeft('Session has started!')
        return
      }
      
      const days = Math.floor(hoursUntilSession / 24)
      const hours = Math.floor(hoursUntilSession % 24)
      const minutes = Math.floor((hoursUntilSession % 1) * 60)
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else {
        setTimeLeft(`${minutes}m`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [sessionDate, sessionTime])

  if (!isLessThan24Hours) {
    return null
  }

  return (
    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <Clock className="w-4 h-4 text-orange-600" />
        <span className="text-sm font-medium text-orange-800">
          Session starts in: {timeLeft}
        </span>
      </div>
    </div>
  )
}






