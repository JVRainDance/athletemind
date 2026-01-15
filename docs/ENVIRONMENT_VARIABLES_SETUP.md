# Environment Variables Setup - Complete Guide

## Overview

This project now uses a centralized environment variable configuration that supports multiple naming conventions for maximum compatibility across different deployment platforms.

## Supported Environment Variable Prefixes

The application checks for environment variables in this priority order:

### For Public Variables (exposed to browser):
1. **`ATHLETEMIND_PUBLIC_*`** (Primary - Vercel deployment)
2. **`NEXT_PUBLIC_*`** (Standard Next.js convention - local development)
3. **`ATHLETEMIND_PUBLICSUPABASE_*`** (Legacy, for backwards compatibility)

### For Server-Side Only Variables:
4. **`SUPABASE_*`** (Server-side fallback)

## Required Environment Variables

### Vercel Production Environment

Set these in your Vercel project settings under **Settings → Environment Variables**:

```bash
# Primary variables (REQUIRED for production)
ATHLETEMIND_PUBLIC_SUPABASE_URL=https://ggkskiecojaxqaradnbm.supabase.co
ATHLETEMIND_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: Additional server-side variables
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

### Local Development (.env.local)

For local development, use the standard Next.js convention:

```bash
# Local development (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://ggkskiecojaxqaradnbm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: Server-side keys (never expose to browser)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

## Architecture Changes

### 1. Centralized Environment Configuration

**File**: [src/lib/env.ts](src/lib/env.ts)

This new file provides two helper functions that check all supported environment variable names:

```typescript
export const getSupabaseUrl = (): string
export const getSupabaseAnonKey = (): string
```

These functions check variables in priority order and throw clear error messages if none are found.

### 2. Server-Side Supabase Client

**File**: [src/lib/supabase-server.ts](src/lib/supabase-server.ts:9-10)

Now uses the centralized `getSupabaseUrl()` and `getSupabaseAnonKey()` helpers. Works with:
- `ATHLETEMIND_PUBLIC_SUPABASE_*` (Vercel)
- `NEXT_PUBLIC_SUPABASE_*` (Local)
- `SUPABASE_*` (Fallback)

### 3. Client-Side Supabase Client

**File**: [src/lib/supabase-client.ts](src/lib/supabase-client.ts:13-21)

Checks for both `ATHLETEMIND_PUBLIC_*` and `NEXT_PUBLIC_*` prefixes since these are the only ones Next.js exposes to the browser.

**Important**: Custom environment variable prefixes in Vercel MUST start with `NEXT_PUBLIC_`, `NEXT_`, or in this case `ATHLETEMIND_PUBLIC_` for them to be available in client-side code.

### 4. Middleware

**File**: [src/middleware.ts](src/middleware.ts:18-25)

Updated to use centralized env helpers with proper error handling.

### 5. Auth Callback Route

**File**: [src/app/auth/callback/route.ts](src/app/auth/callback/route.ts:12-14)

Updated to use centralized env helpers.

### 6. Server-Side Signup API

**File**: [src/app/api/auth/signup/route.ts](src/app/api/auth/signup/route.ts)

New API endpoint that handles user registration server-side, avoiding client-side environment variable issues entirely.

### 7. Register Page

**File**: [src/app/auth/register/page.tsx](src/app/auth/register/page.tsx:24-36)

Now calls the server-side `/api/auth/signup` endpoint instead of using the client directly. This ensures signup works regardless of client-side environment variable availability.

## Files Modified

1. ✅ [src/lib/env.ts](src/lib/env.ts) - **NEW** - Centralized env configuration
2. ✅ [src/lib/supabase-server.ts](src/lib/supabase-server.ts) - Uses env helpers
3. ✅ [src/lib/supabase-client.ts](src/lib/supabase-client.ts) - Checks multiple prefixes
4. ✅ [src/middleware.ts](src/middleware.ts) - Uses env helpers
5. ✅ [src/app/auth/callback/route.ts](src/app/auth/callback/route.ts) - Uses env helpers
6. ✅ [src/app/api/auth/signup/route.ts](src/app/api/auth/signup/route.ts) - **NEW** - Server-side signup
7. ✅ [src/app/auth/register/page.tsx](src/app/auth/register/page.tsx) - Uses signup API
8. ✅ [src/app/api/config/route.ts](src/app/api/config/route.ts) - **NEW** - Config endpoint
9. ✅ [src/app/api/debug-env/route.ts](src/app/api/debug-env/route.ts) - Debug endpoint

## Testing & Verification

### 1. Test Debug Endpoint

After deploying to Vercel, visit:
```
https://your-app.vercel.app/api/debug-env
```

Expected response:
```json
{
  "timestamp": "2025-12-08T...",
  "environment": "production",
  "variablesFound": {
    "ATHLETEMIND_PUBLIC_SUPABASE_URL": true,
    "ATHLETEMIND_PUBLIC_SUPABASE_ANON_KEY": true,
    "NEXT_PUBLIC_SUPABASE_URL": false,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": false,
    ...
  },
  "usingValues": {
    "url": "https://ggkskiecojaxqaradnbm.supabase.co",
    "anonKey": "eyJhbGciOi...xyz",
    "urlLength": 43,
    "anonKeyLength": 180,
    ...
  }
}
```

### 2. Test User Registration

1. Go to `/auth/register`
2. Fill out the registration form
3. Submit
4. Check browser console - should see: `User created: <user-id>`
5. Verify user appears in Supabase Auth dashboard
6. Check email for confirmation link

### 3. Test Local Development

```bash
# Make sure .env.local has NEXT_PUBLIC_* variables
npm run dev

# Try registering a new user locally
# Should work without any environment variable errors
```

## Troubleshooting

### Issue: "Missing Supabase environment variables" error

**Cause**: Environment variables are not set or using wrong prefix

**Solution**:
1. Check Vercel environment variables are set with `ATHLETEMIND_PUBLIC_` prefix
2. Make sure they're applied to the correct environment (Production/Preview/Development)
3. Redeploy after adding/changing variables

### Issue: Client-side code can't access environment variables

**Cause**: Next.js only exposes variables with `NEXT_PUBLIC_` prefix (or custom prefixes registered in Vercel)

**Solution**:
- Use `ATHLETEMIND_PUBLIC_*` prefix in Vercel (already configured)
- Use `NEXT_PUBLIC_*` prefix for local development
- Or use server-side API endpoints (recommended for sensitive operations)

### Issue: 404 error on oauth/clients endpoint

**Cause**: Wrong API key or Supabase URL being used

**Solution**:
1. Visit `/api/debug-env` to verify correct values are loaded
2. Check that `ATHLETEMIND_PUBLIC_SUPABASE_URL` points to: `https://ggkskiecojaxqaradnbm.supabase.co`
3. Verify the anon key is not a temporary/test key

## Migration from Old Setup

### Old Way (❌ Not Working):
```typescript
// Direct env access - doesn't work with custom prefixes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### New Way (✅ Working):
```typescript
// Server-side: Use centralized helpers
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env'

const supabase = createServerClient(
  getSupabaseUrl(),
  getSupabaseAnonKey(),
  // ... cookies config
)

// Client-side: Use server API endpoints or updated client
import { createClient } from '@/lib/supabase-client'
const supabase = createClient() // Automatically checks multiple prefixes
```

## Summary

✅ **Server-side code**: Works with all environment variable naming conventions via centralized helpers

✅ **Client-side code**: Checks both `ATHLETEMIND_PUBLIC_*` and `NEXT_PUBLIC_*` prefixes

✅ **Auth operations**: Use server-side API endpoints to avoid client-side env issues

✅ **Debugging**: Use `/api/debug-env` endpoint to verify configuration

✅ **Local dev**: Use standard `NEXT_PUBLIC_*` prefix in `.env.local`

✅ **Vercel prod**: Use `ATHLETEMIND_PUBLIC_*` prefix in Vercel settings
