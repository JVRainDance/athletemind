'use client'

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  loadingText?: string
  fullWidth?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantClasses = {
      primary:
        'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800 shadow-sm hover:shadow',
      secondary:
        'text-white bg-secondary-600 hover:bg-secondary-700 focus:ring-secondary-500 active:bg-secondary-800 shadow-sm hover:shadow',
      outline:
        'text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 focus:ring-primary-500 active:bg-gray-100',
      ghost:
        'text-gray-700 hover:bg-gray-100 focus:ring-primary-500 active:bg-gray-200',
      danger:
        'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 active:bg-red-800 shadow-sm hover:shadow',
    }

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm min-h-[36px]',
      md: 'px-4 py-2 text-sm min-h-[44px]',
      lg: 'px-6 py-3 text-base min-h-[48px]',
    }

    const widthClasses = fullWidth ? 'w-full' : ''

    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    }

    const iconMarginClasses =
      iconPosition === 'left' ? 'mr-2' : 'ml-2'

    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${widthClasses}
          ${className}
        `}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2
            className={`${iconSizeClasses[size]} mr-2 animate-spin`}
            aria-hidden="true"
          />
        )}

        {!loading && icon && iconPosition === 'left' && (
          <span className={iconMarginClasses} aria-hidden="true">
            {icon}
          </span>
        )}

        <span>{loading && loadingText ? loadingText : children}</span>

        {!loading && icon && iconPosition === 'right' && (
          <span className={iconMarginClasses} aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Icon Button for icon-only buttons
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string // Required for accessibility
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      variant = 'ghost',
      size = 'md',
      loading = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantClasses = {
      primary:
        'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800',
      secondary:
        'text-white bg-secondary-600 hover:bg-secondary-700 focus:ring-secondary-500 active:bg-secondary-800',
      outline:
        'text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 focus:ring-primary-500 active:bg-gray-100',
      ghost:
        'text-gray-700 hover:bg-gray-100 focus:ring-primary-500 active:bg-gray-200',
      danger:
        'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    }

    const sizeClasses = {
      sm: 'p-1.5 min-w-[36px] min-h-[36px]',
      md: 'p-2 min-w-[44px] min-h-[44px]',
      lg: 'p-3 min-w-[48px] min-h-[48px]',
    }

    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }

    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        aria-label={label}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Loader2
            className={`${iconSizeClasses[size]} animate-spin`}
            aria-hidden="true"
          />
        ) : (
          <span className={iconSizeClasses[size]} aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

// Button Group for grouping related buttons
interface ButtonGroupProps {
  children: ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function ButtonGroup({
  children,
  className = '',
  orientation = 'horizontal',
}: ButtonGroupProps) {
  const orientationClasses =
    orientation === 'horizontal'
      ? 'flex flex-row space-x-2'
      : 'flex flex-col space-y-2'

  return (
    <div className={`${orientationClasses} ${className}`} role="group">
      {children}
    </div>
  )
}
