/**
 * Design System - Animation Tokens
 * Consistent animation timing, easing, and presets
 */

export const animationDurations = {
  instant: '0ms',
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '400ms',
  slowest: '500ms',
} as const

export const animationEasing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const

// Framer Motion animation variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
}

export const slideInRight = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
}

export const slideInLeft = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
}

// Micro-interactions
export const buttonPress = {
  scale: 0.95,
  transition: { duration: 0.1 },
}

export const cardHover = {
  y: -4,
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  transition: { duration: 0.2 },
}

export const iconSpin = {
  rotate: 360,
  transition: { duration: 1, repeat: Infinity, ease: 'linear' },
}

export const starSparkle = {
  scale: [1, 1.2, 1],
  rotate: [0, 180, 360],
  transition: { duration: 0.6, ease: 'easeInOut' },
}

export const achievementPop = {
  scale: [0, 1.1, 1],
  rotate: [0, 5, -5, 0],
  transition: { duration: 0.5, ease: 'spring' },
}

// Page transitions
export const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3 },
}

// Stagger animations for lists
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}
