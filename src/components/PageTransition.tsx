'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div
      className={`
        transition-opacity duration-150
        ${isTransitioning ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {children}
    </div>
  )
}

// Loading bar that appears at the top during navigation
export function NavigationProgress() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-1"
      role="progressbar"
      aria-label="Page loading progress"
      aria-hidden={!isLoading}
    >
      <div
        className={`
          h-full bg-gradient-to-r from-primary-500 to-secondary-500
          transition-all duration-300 ease-out
          ${isLoading ? 'w-full' : 'w-0'}
        `}
      />
    </div>
  )
}

// Fade transition wrapper for sections
interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function FadeIn({
  children,
  delay = 0,
  duration = 300,
  className = '',
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`
        transition-opacity
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

// Slide in from direction
interface SlideInProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
  className?: string
}

export function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 300,
  className = '',
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const translateClasses = {
    up: isVisible ? 'translate-y-0' : 'translate-y-4',
    down: isVisible ? 'translate-y-0' : '-translate-y-4',
    left: isVisible ? 'translate-x-0' : 'translate-x-4',
    right: isVisible ? 'translate-x-0' : '-translate-x-4',
  }

  return (
    <div
      className={`
        transition-all
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${translateClasses[direction]}
        ${className}
      `}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

// Staggered list animation
interface StaggeredListProps {
  children: ReactNode[]
  staggerDelay?: number
  className?: string
}

export function StaggeredList({
  children,
  staggerDelay = 50,
  className = '',
}: StaggeredListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * staggerDelay} duration={300}>
          {child}
        </FadeIn>
      ))}
    </div>
  )
}

// Scale animation for modals/popovers
interface ScaleInProps {
  children: ReactNode
  isVisible: boolean
  duration?: number
  className?: string
}

export function ScaleIn({
  children,
  isVisible,
  duration = 200,
  className = '',
}: ScaleInProps) {
  return (
    <div
      className={`
        transition-all origin-center
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        ${className}
      `}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}
