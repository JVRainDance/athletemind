/**
 * Design System - Responsive Breakpoints
 * Consistent breakpoints for responsive design
 */

export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Large desktop
} as const

export type Breakpoint = keyof typeof breakpoints

// Media query helpers
export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
} as const

// Mobile-first breakpoint utilities
export const isAboveBreakpoint = (width: number, breakpoint: Breakpoint): boolean => {
  const breakpointValue = parseInt(breakpoints[breakpoint])
  return width >= breakpointValue
}

export const isBelowBreakpoint = (width: number, breakpoint: Breakpoint): boolean => {
  const breakpointValue = parseInt(breakpoints[breakpoint])
  return width < breakpointValue
}
