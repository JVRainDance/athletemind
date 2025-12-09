'use client'

/**
 * Skip Navigation Link
 *
 * Provides keyboard users a way to skip repetitive navigation and jump
 * directly to main content. This is a WCAG 2.1 Level A requirement.
 *
 * Usage:
 * 1. Add <SkipNav /> at the very top of your layout
 * 2. Add id="main-content" to your main content element
 */

export function SkipNav() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView()
    }
  }

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-[9999]
        focus:px-4 focus:py-2
        focus:bg-primary-600 focus:text-white
        focus:rounded-md focus:shadow-lg
        focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        focus:outline-none
        font-medium text-sm
        transition-all
      "
    >
      Skip to main content
    </a>
  )
}

// Skip to specific sections
interface SkipLinksProps {
  links?: Array<{
    id: string
    label: string
  }>
}

export function SkipLinks({ links }: SkipLinksProps) {
  const defaultLinks = [
    { id: 'main-content', label: 'Skip to main content' },
    { id: 'main-navigation', label: 'Skip to navigation' },
  ]

  const skipLinks = links || defaultLinks

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.focus()
      element.scrollIntoView()
    }
  }

  return (
    <nav aria-label="Skip links" className="sr-only focus-within:not-sr-only">
      <ul className="fixed top-4 left-4 z-[9999] flex flex-col gap-2">
        {skipLinks.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.id}`}
              onClick={(e) => handleClick(e, link.id)}
              className="
                sr-only focus:not-sr-only
                focus:block focus:px-4 focus:py-2
                focus:bg-primary-600 focus:text-white
                focus:rounded-md focus:shadow-lg
                focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                focus:outline-none
                font-medium text-sm
                transition-all
              "
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Landmark regions helper
export function MainContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`focus:outline-none ${className}`}
      role="main"
    >
      {children}
    </main>
  )
}

export function MainNavigation({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <nav
      id="main-navigation"
      tabIndex={-1}
      className={`focus:outline-none ${className}`}
      aria-label="Main navigation"
    >
      {children}
    </nav>
  )
}
