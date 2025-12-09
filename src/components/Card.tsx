'use client'

import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Card({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    outlined: 'bg-white border-2 border-gray-300',
    elevated: 'bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow',
  }

  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  }

  return (
    <div
      className={`
        rounded-lg
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, icon, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div className="flex items-start space-x-3 flex-1">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`text-gray-700 ${className}`}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
  divider?: boolean
}

export function CardFooter({ children, className = '', divider = true }: CardFooterProps) {
  return (
    <div
      className={`
        ${divider ? 'pt-4 border-t border-gray-200 mt-4' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Preset card patterns
interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: string
    trend: 'up' | 'down' | 'neutral'
  }
  icon?: ReactNode
  className?: string
}

export function StatCard({ title, value, change, icon, className = '' }: StatCardProps) {
  const trendColors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  }

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {change && (
          <span
            className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              ${trendColors[change.trend]}
            `}
          >
            {change.value}
          </span>
        )}
      </div>
    </Card>
  )
}

interface ActionCardProps {
  title: string
  description: string
  action: ReactNode
  icon?: ReactNode
  variant?: 'info' | 'success' | 'warning' | 'error'
  className?: string
}

export function ActionCard({
  title,
  description,
  action,
  icon,
  variant = 'info',
  className = '',
}: ActionCardProps) {
  const variantColors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }

  const iconColors = {
    info: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
  }

  return (
    <div
      className={`
        rounded-lg border p-4
        ${variantColors[variant]}
        ${className}
      `}
    >
      <div className="flex items-start">
        {icon && <div className={`flex-shrink-0 mr-3 ${iconColors[variant]}`}>{icon}</div>}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium mb-1">{title}</h3>
          <p className="text-sm opacity-90 mb-3">{description}</p>
          {action}
        </div>
      </div>
    </div>
  )
}
