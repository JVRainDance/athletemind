"use client"

import { useEffect } from "react"
import confetti from "canvas-confetti"

interface CelebrationProps {
  trigger: boolean
  particleCount?: number
  spread?: number
}

export function Celebration({ trigger, particleCount = 100, spread = 70 }: CelebrationProps) {
  useEffect(() => {
    if (trigger) {
      confetti({
        particleCount,
        spread,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      })
    }
  }, [trigger, particleCount, spread])

  return null
}

export function triggerConfetti(options?: {
  particleCount?: number
  spread?: number
  origin?: { x?: number; y?: number }
}) {
  confetti({
    particleCount: options?.particleCount || 100,
    spread: options?.spread || 70,
    origin: options?.origin || { y: 0.6 },
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  })
}
