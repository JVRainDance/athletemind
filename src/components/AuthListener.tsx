'use client'

import { useEffect } from 'react'
import { setupAuthListener } from '@/lib/auth-listener'

export default function AuthListener() {
  useEffect(() => {
    setupAuthListener()
  }, [])

  return null // This component doesn't render anything
}
