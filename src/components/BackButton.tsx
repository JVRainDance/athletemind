'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  href?: string
  text?: string
  className?: string
}

export default function BackButton({ 
  href, 
  text = 'Back', 
  className = '' 
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={href ? `Navigate to ${text}` : 'Go back to previous page'}
      className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${className}`}
    >
      <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
      {text}
    </button>
  )
}

