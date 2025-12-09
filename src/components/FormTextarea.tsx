'use client'

import { TextareaHTMLAttributes, forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  helperText?: string
  characterLimit?: number
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, helperText, characterLimit, className = '', ...props }, ref) => {
    const hasError = !!error
    const currentLength = props.value?.toString().length || 0
    const showCharacterCount = characterLimit && characterLimit > 0

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {showCharacterCount && (
            <span
              className={`text-xs ${
                currentLength > characterLimit
                  ? 'text-red-600 font-medium'
                  : 'text-gray-500'
              }`}
            >
              {currentLength} / {characterLimit}
            </span>
          )}
        </div>

        <textarea
          ref={ref}
          className={`
            appearance-none block w-full px-3 py-2
            border rounded-md shadow-sm
            placeholder-gray-400 text-gray-900
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            sm:text-sm resize-y
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
          maxLength={characterLimit}
          {...props}
        />

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

FormTextarea.displayName = 'FormTextarea'
