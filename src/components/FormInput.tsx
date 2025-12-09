'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, icon, className = '', ...props }, ref) => {
    const hasError = !!error

    return (
      <div className="w-full">
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-gray-400">{icon}</div>
            </div>
          )}

          <input
            ref={ref}
            className={`
              appearance-none block w-full px-3 py-2
              ${icon ? 'pl-10' : ''}
              border rounded-md shadow-sm
              placeholder-gray-400 text-gray-900
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              sm:text-sm
              ${
                hasError
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }
              ${className}
            `}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${props.id}-error`
                : helperText
                ? `${props.id}-helper`
                : undefined
            }
            {...props}
          />
        </div>

        {/* Error message */}
        {hasError && (
          <div
            id={`${props.id}-error`}
            className="mt-2 flex items-start gap-2 text-sm text-red-600"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Helper text (only shown when no error) */}
        {!hasError && helperText && (
          <p id={`${props.id}-helper`} className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
