# Component Usage Guide

Quick reference for using the new world-class UI components.

---

## 🎨 Design Tokens

**Always use tokens instead of hardcoded values:**

```tsx
import { colors, spacing, typography, shadows } from '@/styles/tokens'

// ✅ Good
<div style={{ color: colors.text.primary, padding: spacing[4] }} />

// ❌ Bad
<div style={{ color: '#111827', padding: '16px' }} />
```

**Common Tokens:**
```tsx
colors.primary[600]           // Brand blue button
colors.text.primary           // Main text color
colors.border.light           // Border color
spacing[4]                    // 16px spacing
typography.fontSize.base      // 16px font
shadows.md                    // Card shadow
```

---

## 📝 Forms

### FormInput
```tsx
import { FormInput } from '@/components/FormInput'
import { Mail } from 'lucide-react'

<FormInput
  id="email"
  label="Email address"
  type="email"
  placeholder="you@example.com"
  icon={<Mail />}
  error={errors.email}
  helperText="We'll never share your email"
  required
  disabled={loading}
/>
```

### FormTextarea
```tsx
import { FormTextarea } from '@/components/FormTextarea'

<FormTextarea
  id="description"
  label="Description"
  placeholder="Tell us about..."
  error={errors.description}
  helperText="Provide detailed information"
  characterLimit={500}
  rows={4}
  required
/>
```

---

## 🃏 Cards

### Basic Card
```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/Card'
import { Calendar } from 'lucide-react'

<Card variant="elevated" padding="lg">
  <CardHeader
    title="Next Session"
    subtitle="Tomorrow at 3:00 PM"
    icon={<Calendar />}
    action={<button>Edit</button>}
  />
  <CardContent>
    <p>Your training details here</p>
  </CardContent>
  <CardFooter>
    <button>View Details</button>
  </CardFooter>
</Card>
```

### StatCard
```tsx
import { StatCard } from '@/components/Card'
import { TrendingUp } from 'lucide-react'

<StatCard
  title="Completed Sessions"
  value={42}
  change={{
    value: '+12%',
    trend: 'up'
  }}
  icon={<TrendingUp />}
/>
```

### ActionCard
```tsx
import { ActionCard } from '@/components/Card'
import { AlertCircle } from 'lucide-react'

<ActionCard
  variant="warning"
  title="Complete your profile"
  description="Add your training preferences to get started"
  icon={<AlertCircle />}
  action={
    <button>Complete now</button>
  }
/>
```

---

## 💀 Skeletons

### Loading States
```tsx
import { Skeleton, SkeletonText, SkeletonCard } from '@/components/Skeleton'

// Text skeleton
<SkeletonText lines={3} />

// Circular avatar
<Skeleton variant="circular" width={48} height={48} />

// Rectangular box
<Skeleton variant="rectangular" height={200} />

// Card skeleton
<SkeletonCard />
```

### Dashboard Skeletons
```tsx
import {
  DashboardSkeleton,
  SessionsListSkeleton,
  ProgressChartSkeleton
} from '@/components/DashboardSkeleton'

{loading ? <DashboardSkeleton /> : <Dashboard data={data} />}
```

---

## 🔔 Toasts

### Setup
```tsx
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'

function MyComponent() {
  const { toasts, success, error, warning, info, removeToast } = useToast()

  const handleSave = async () => {
    try {
      await saveData()
      success('Saved successfully!')
    } catch (e) {
      error('Failed to save. Please try again.')
    }
  }

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}
```

### Toast Types
```tsx
success('Operation completed!', 5000)  // Auto-dismiss after 5s
error('Something went wrong')          // Default 5s duration
warning('This action cannot be undone')
info('New feature available')
```

---

## 🚨 Error Handling

### Error Boundary
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

<ErrorBoundary onError={(error) => logToSentry(error)}>
  <YourApp />
</ErrorBoundary>
```

### Network Error
```tsx
import { NetworkError } from '@/components/ErrorBoundary'

{error && (
  <NetworkError
    title="Connection lost"
    message="Please check your internet connection"
    onRetry={() => refetch()}
  />
)}
```

### Empty State
```tsx
import { EmptyState } from '@/components/ErrorBoundary'
import { Calendar } from 'lucide-react'

<EmptyState
  icon={<Calendar />}
  title="No sessions yet"
  description="Get started by creating your first training session"
  action={
    <button onClick={() => openModal()}>
      Create Session
    </button>
  }
/>
```

---

## 🔄 API Calls with Retry

### useFetch Hook
```tsx
import { useFetch } from '@/hooks/useApi'
import { NetworkError } from '@/components/ErrorBoundary'
import { DashboardSkeleton } from '@/components/DashboardSkeleton'

function Dashboard() {
  const { data, loading, error, fetchData } = useFetch({
    retries: 3,
    retryDelay: 1000
  })

  useEffect(() => {
    fetchData('/api/dashboard')
  }, [])

  if (loading) return <DashboardSkeleton />
  if (error) return <NetworkError onRetry={() => fetchData('/api/dashboard')} />

  return <DashboardContent data={data} />
}
```

### useApi Hook (Generic)
```tsx
import { useApi } from '@/hooks/useApi'

const { data, loading, error, execute } = useApi({
  retries: 3,
  retryDelay: 1000,
  onError: (error) => {
    console.error('API Error:', error)
  }
})

const handleSubmit = async () => {
  await execute(async () => {
    const response = await fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify(formData)
    })
    return response.json()
  })
}
```

---

## 🎯 Accessibility Best Practices

### Interactive Elements
```tsx
// ✅ Good - Has aria-label and proper sizing
<button
  aria-label="Delete session"
  className="min-h-[44px] min-w-[44px]"
>
  <Trash aria-hidden="true" />
</button>

// ❌ Bad - No label, too small
<button className="p-1">
  <Trash />
</button>
```

### Form Inputs
```tsx
// ✅ Good - Connected label, error handling
<FormInput
  id="email"
  label="Email"
  error={errors.email}
  aria-describedby={errors.email ? 'email-error' : 'email-helper'}
/>

// ❌ Bad - No label, no error handling
<input type="email" placeholder="Email" />
```

### Modals (Using Radix Dialog)
```tsx
import * as Dialog from '@radix-ui/react-dialog'

<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Confirm Action</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to continue?
      </Dialog.Description>
      <Dialog.Close asChild>
        <button>Cancel</button>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

---

## 🎨 Common Patterns

### Loading Button
```tsx
<button
  disabled={loading}
  className="inline-flex items-center px-4 py-2 disabled:opacity-50"
>
  {loading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
      Saving...
    </>
  ) : (
    'Save'
  )}
</button>
```

### Async Form Submission
```tsx
const { execute } = useApi()
const { success, error } = useToast()

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const result = await execute(async () => {
    return await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(formData)
    }).then(r => r.json())
  })

  if (result) {
    success('Saved successfully!')
    router.push('/dashboard')
  } else {
    error('Failed to save. Please try again.')
  }
}
```

### Data Fetching with States
```tsx
function DataList() {
  const { data, loading, error, fetchData } = useFetch()

  useEffect(() => {
    fetchData('/api/items')
  }, [])

  // Loading state
  if (loading) return <SkeletonCard />

  // Error state
  if (error) return (
    <NetworkError
      onRetry={() => fetchData('/api/items')}
    />
  )

  // Empty state
  if (!data?.length) return (
    <EmptyState
      title="No items found"
      description="Get started by adding your first item"
    />
  )

  // Success state
  return (
    <div>
      {data.map(item => (
        <Card key={item.id}>
          {item.name}
        </Card>
      ))}
    </div>
  )
}
```

---

## 📱 Responsive Design

### Touch Targets
```tsx
// Always ensure minimum 44x44px touch targets
<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  Click me
</button>
```

### Mobile-First Approach
```tsx
<div className="p-4 sm:p-6 lg:p-8">
  <h1 className="text-lg sm:text-xl lg:text-2xl">
    Responsive Title
  </h1>
</div>
```

---

## 🔍 Quick Reference

| Component | Use Case | Import |
|-----------|----------|--------|
| FormInput | Text inputs | `@/components/FormInput` |
| FormTextarea | Multiline inputs | `@/components/FormTextarea` |
| Card | Content containers | `@/components/Card` |
| StatCard | Metrics display | `@/components/Card` |
| Skeleton | Loading states | `@/components/Skeleton` |
| Toast | Notifications | `@/components/Toast` + `@/hooks/useToast` |
| ErrorBoundary | Error handling | `@/components/ErrorBoundary` |
| useFetch | API calls | `@/hooks/useApi` |
| tokens | Design values | `@/styles/tokens` |

---

**Need help?** See `WORLD_CLASS_UI_IMPROVEMENTS.md` for detailed documentation.
