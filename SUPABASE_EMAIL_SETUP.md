# Supabase Email Authentication Setup Guide
**Issue:** Users not receiving confirmation emails on production

---

## Problem Diagnosis

When a user signs up on your Vercel deployment:
- ✅ The page redirects to confirmation screen
- ❌ No email is sent
- ❌ No user appears in Supabase Auth

**Root Cause:** Supabase's default email service has strict rate limits and may not be properly configured for your production domain.

---

## Quick Fix: Disable Email Confirmation (Testing Only)

**⚠️ NOT recommended for production - users won't verify their email addresses**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **ggkskiecojaxqaradnbm**
3. Navigate to **Authentication** → **Providers** → **Email**
4. Scroll down and **disable** "Confirm email"
5. Click **Save**

Now users can sign up instantly without email verification.

---

## Production Solution: Configure Custom SMTP

### Step 1: Choose an Email Provider

**Recommended Options:**

#### Option A: SendGrid (Free tier: 100 emails/day)
1. Sign up at [SendGrid](https://sendgrid.com)
2. Create an API key
3. Verify sender email address

#### Option B: Gmail (Free, but has limits)
1. Enable 2FA on your Google account
2. Create an [App Password](https://myaccount.google.com/apppasswords)
3. Use your Gmail + App Password

#### Option C: AWS SES (Production grade)
- Best for scale
- Pay per email sent
- Requires domain verification

#### Option D: Mailgun, Postmark, etc.
- All work with SMTP

---

### Step 2: Configure SMTP in Supabase

1. Go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Toggle **Enable Custom SMTP**

#### SendGrid Configuration:
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [Your SendGrid API Key - starts with SG.]
Sender Email: noreply@yourdomain.com (must be verified in SendGrid)
Sender Name: AthleteMind
```

#### Gmail Configuration:
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Password: [16-character App Password from Google]
Sender Email: your-email@gmail.com
Sender Name: AthleteMind
```

#### Mailgun Configuration:
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: postmaster@your-domain.mailgun.org
SMTP Password: [Your Mailgun SMTP password]
Sender Email: noreply@your-domain.com
Sender Name: AthleteMind
```

4. Click **Save**

---

### Step 3: Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://your-vercel-app.vercel.app`
3. Add **Redirect URLs**:
   ```
   https://your-vercel-app.vercel.app/*
   https://your-vercel-app.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
4. Click **Save**

---

### Step 4: Customize Email Template (Optional)

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. Customize the template (or use the custom one in `email-templates/confirmation-email.html`)

**Default variables available:**
- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your site URL

**Important:** Make sure the template includes:
```html
<a href="{{ .ConfirmationURL }}">Confirm Email</a>
```

---

## Verification Steps

### Test Email Sending

1. Try signing up with a test email
2. Check:
   - ✅ User appears in **Authentication** → **Users**
   - ✅ User status shows "Waiting for verification"
   - ✅ Email received in inbox (check spam folder)
   - ✅ Clicking link confirms the account

### Check Supabase Logs

1. Go to **Project Settings** → **Logs**
2. Look for email-related errors
3. Common issues:
   - SMTP authentication failed
   - Sender email not verified
   - Rate limit exceeded

---

## Code Changes Made

### Updated Registration Flow
**File:** `src/app/auth/register/page.tsx`

**Changes:**
1. Added `emailRedirectTo` to ensure proper callback URL
2. Added better error logging (check browser console)
3. Added duplicate email detection
4. Better error messages

**Now logs:**
- "User created: [user-id]" - User successfully created
- "Registration error: [error]" - Supabase returned an error

---

## Troubleshooting

### Issue: User created but no email sent

**Check:**
1. Supabase Dashboard → **Authentication** → **Users**
   - Is user there with "Waiting for verification" status?
2. **Project Settings** → **Auth** → **SMTP Settings**
   - Is SMTP enabled and configured?
3. Email provider dashboard
   - Are emails being sent?
   - Check delivery logs

**Fix:**
- Test SMTP settings with a test email tool
- Check sender email is verified with your provider
- Review email provider logs for bounces/blocks

---

### Issue: Email goes to spam

**Fixes:**
1. Use a custom domain email (noreply@yourdomain.com)
2. Set up SPF/DKIM records for your domain
3. Use a reputable email service (SendGrid, Mailgun)
4. Avoid spam trigger words in subject/content

---

### Issue: Rate limits on Supabase default email

**Supabase Default Limits:**
- 3 emails per hour per project
- 30 emails per hour across all Supabase projects from your IP

**Fix:** Use custom SMTP (no limits from Supabase side)

---

### Issue: "Invalid email" error

**Causes:**
- Email already registered
- Email format invalid
- Temporary email providers blocked

**Check:**
1. Supabase Dashboard → **Authentication** → **Providers** → **Email**
2. Look for "Block disposable email providers" setting

---

## Environment Variables

Make sure your Vercel environment variables are set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ggkskiecojaxqaradnbm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Verify in Vercel:**
1. Go to your project settings
2. **Settings** → **Environment Variables**
3. Make sure variables are set for **Production**
4. Redeploy if you added/changed variables

**Debug Environment Variables (Production):**

To verify the correct environment variables are being used in production:

1. Deploy the latest code with the debug endpoint
2. Visit: `https://your-vercel-app.vercel.app/api/debug-env`
3. Check the response:
   - `url` should show your Supabase URL: `https://ggkskiecojaxqaradnbm.supabase.co`
   - `urlPrefix` should show: `https://`
   - `keyPrefix` should show the first 10 characters of your anon key
   - `anonKeyLength` should be around 150-200 characters
   - Should NOT show `sb_temp_` prefix

4. If values are wrong or showing `NOT_SET`:
   - Double-check Vercel environment variables
   - Make sure they're set for the correct environment (Production/Preview/Development)
   - Redeploy after fixing

5. Check browser console during signup:
   - Look for "Environment check" log
   - Look for "Signup response" log
   - These will help identify if the issue is with environment variables or Supabase configuration

---

## Testing Checklist

- [ ] SMTP configured in Supabase
- [ ] Sender email verified with email provider
- [ ] Site URL set to Vercel domain
- [ ] Redirect URLs include `/auth/callback`
- [ ] Environment variables set in Vercel
- [ ] Test signup creates user in Supabase
- [ ] Test email received in inbox
- [ ] Confirmation link works and activates account
- [ ] User can log in after confirmation

---

## Quick Test Commands

### Check if user was created (Browser Console):
```javascript
const supabase = createClient()
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'testpassword123'
})
console.log('User:', data.user)
console.log('Error:', error)
```

### Check current session:
```javascript
const { data } = await supabase.auth.getSession()
console.log('Session:', data.session)
```

---

## Recommended Setup for Production

1. **Email Provider:** SendGrid (free tier is sufficient to start)
2. **Domain:** Use custom domain with verified sender
3. **Email Confirmation:** Enabled (for security)
4. **Rate Limiting:** Supabase default is fine with custom SMTP
5. **Templates:** Use custom branded templates

---

## Next Steps

1. Set up custom SMTP (choose SendGrid for easiest setup)
2. Verify sender email with provider
3. Configure Supabase SMTP settings
4. Test with a real email address
5. Check all confirmation flows work
6. Monitor email delivery in provider dashboard

---

## Support Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [SendGrid Setup](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Status:** Code updated ✅
**Action Required:** Configure SMTP in Supabase Dashboard

Once SMTP is configured, emails will be sent successfully and users will appear in your Supabase Auth users table.
