import { useRouter } from 'next/navigation'

export function useNavigation() {
  const router = useRouter()

  const navigateToRoleDashboard = (role: string) => {
    switch (role) {
      case 'athlete':
        window.location.href = '/dashboard/athlete'
        break
      case 'coach':
        window.location.href = '/dashboard/coach'
        break
      case 'parent':
        window.location.href = '/dashboard/parent'
        break
      default:
        window.location.href = '/dashboard'
    }
  }

  const navigateToLogin = () => {
    window.location.href = '/auth/login'
  }

  const navigateToRegister = () => {
    window.location.href = '/auth/register'
  }

  const navigateToDashboard = () => {
    window.location.href = '/dashboard'
  }

  return {
    router,
    navigateToRoleDashboard,
    navigateToLogin,
    navigateToRegister,
    navigateToDashboard,
  }
}

// Utility function for server-side redirects
export function getRoleRedirectPath(role: string): string {
  switch (role) {
    case 'athlete':
      return '/dashboard/athlete'
    case 'coach':
      return '/dashboard/coach'
    case 'parent':
      return '/dashboard/parent'
    default:
      return '/dashboard'
  }
}




