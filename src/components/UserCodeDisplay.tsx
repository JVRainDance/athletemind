'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from '@/lib/toast'

interface UserCodeDisplayProps {
  code: string
  showCopy?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserCodeDisplay({
  code,
  showCopy = true,
  size = 'md',
  className = ''
}: UserCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-xl px-4 py-3'
  }

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy code')
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <code
        className={`
          bg-gray-100 rounded-lg font-mono font-bold text-primary-700
          tracking-wider border border-gray-200
          ${sizeClasses[size]}
        `}
      >
        {code}
      </code>
      {showCopy && (
        <button
          onClick={handleCopy}
          className={`
            p-2 rounded-lg transition-colors
            ${copied
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
          title="Copy code"
        >
          {copied ? (
            <Check className={iconSizes[size]} />
          ) : (
            <Copy className={iconSizes[size]} />
          )}
        </button>
      )}
    </div>
  )
}

export default UserCodeDisplay
