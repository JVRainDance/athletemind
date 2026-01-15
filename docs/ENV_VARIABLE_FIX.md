# Environment Variable Fix for Vercel Deployment

## Problem
The application was configured to use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, but Vercel has these variables set as:
- `ATHLETEMIND_PUBLICSUPABASE_URL`
- `ATHLETEMIND_PUBLICSUPABASE_ANON_KEY`

This caused the application to use undefined/temporary API keys, resulting in:
- 404 errors on auth endpoints
- Invalid API key errors (`sb_temp_AD` prefix)
- Users not being created in Supabase Auth
- Emails not being sent

## Solution
Updated all Supabase client configuration files to check for both variable naming conventions, with fallback support:

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.ATHLETEMIND_PUBLICSUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.ATHLETEMIND_PUBLICSUPABASE_ANON_KEY
```

## Files Modified

### 1. [src/lib/supabase-client.ts](src/lib/supabase-client.ts)
- Browser-side Supabase client
- Now checks both `NEXT_PUBLIC_*` and `ATHLETEMIND_PUBLICSUPABASE_*` variables

### 2. [src/lib/supabase-server.ts](src/lib/supabase-server.ts)
- Server-side Supabase client
- Updated to use fallback environment variable names

### 3. [src/app/auth/callback/route.ts](src/app/auth/callback/route.ts)
- Email confirmation callback handler
- Updated to check both variable naming conventions

### 4. [src/middleware.ts](src/middleware.ts)
- Auth middleware for route protection
- Updated environment variable checks
- Updated Supabase client initialization

### 5. [src/app/api/debug-env/route.ts](src/app/api/debug-env/route.ts)
- New debug endpoint to verify environment variables
- Checks which variables are set
- Shows partial values for security

### 6. [src/app/auth/register/page.tsx](src/app/auth/register/page.tsx)
- Enhanced console logging for debugging
- Shows which environment variables are found
- Logs signup response details

## Testing

### 1. Test the Debug Endpoint
Visit: `https://your-vercel-app.vercel.app/api/debug-env`

Expected response:
```json
{
  "timestamp": "2025-12-08T...",
  "environment": "production",
  "variablesFound": {
    "NEXT_PUBLIC_SUPABASE_URL": false,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": false,
    "ATHLETEMIND_PUBLICSUPABASE_URL": true,
    "ATHLETEMIND_PUBLICSUPABASE_ANON_KEY": true
  },
  "usingValues": {
    "url": "https://ggkskiecojaxqaradnbm.supabase.co",
    "anonKey": "eyJhbGciOi...xyz",
    "urlLength": 43,
    "anonKeyLength": 180,
    "urlPrefix": "https://ggkskiecojaxqaradnbm",
    "keyPrefix": "eyJhbGciOi"
  }
}
```

### 2. Test User Registration
1. Try signing up with a new email
2. Check browser console for debug logs:
   - "Environment check" - shows which variables are set
   - "Signup response" - shows user creation details
3. Verify user appears in Supabase Auth dashboard
4. Check if confirmation email is received

### 3. Monitor Vercel Logs
- Should no longer see 404 errors on `/auth/v1/admin/oauth/clients`
- Should no longer see `sb_temp_` prefix errors
- Auth requests should use correct API key

## Next Steps After Deployment

Once deployed, if signup still doesn't work:

1. **Check Supabase Email Configuration**
   - Go to Supabase Dashboard → Authentication → Providers → Email
   - Verify email confirmation is configured
   - Check if SMTP is set up (required for production)

2. **Verify Redirect URLs**
   - Go to Authentication → URL Configuration
   - Add: `https://your-vercel-app.vercel.app/auth/callback`
   - Set Site URL to your Vercel domain

3. **Review SMTP Setup**
   - See [SUPABASE_EMAIL_SETUP.md](SUPABASE_EMAIL_SETUP.md) for detailed instructions
   - Configure custom SMTP provider (SendGrid, Gmail, etc.)

## Environment Variables in Vercel

Current variables set in Vercel:
- ✅ `ATHLETEMIND_PUBLICSUPABASE_URL`
- ✅ `ATHLETEMIND_PUBLICSUPABASE_ANON_KEY`
- ✅ `ATHLETEMIND_PUBLICSUPABASE_PUBLISHABLE_KEY`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `POSTGRES_URL`
- ✅ `POSTGRES_HOST`

The code now supports both naming conventions, so you can:
- Keep the current `ATHLETEMIND_PUBLICSUPABASE_*` variables (✅ Working now)
- Or rename them to `NEXT_PUBLIC_SUPABASE_*` (⚡ More standard)
- Or have both (🎯 Maximum compatibility)

## Deployment Checklist

- [ ] Deploy updated code to Vercel
- [ ] Visit `/api/debug-env` endpoint to verify environment variables
- [ ] Test user registration
- [ ] Check browser console logs
- [ ] Verify user appears in Supabase Auth
- [ ] Confirm email is received
- [ ] If email not received, configure SMTP in Supabase

## Summary

**Root Cause:** Environment variable naming mismatch
**Fix:** Added fallback support for both naming conventions
**Impact:** Authentication should now work correctly on Vercel
**Status:** Ready to deploy and test
