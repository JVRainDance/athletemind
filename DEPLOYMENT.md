# AthleteMind Deployment Guide

## 🚀 Supabase Deployment Instructions

### Prerequisites
- Supabase account (free tier available)
- GitHub repository with your code
- Vercel account (for frontend deployment)

### Step 1: Create Supabase Project

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Click "New Project"**
3. **Fill in project details:**
   - Organization: Select your organization
   - Name: `athletemind` (or your preferred name)
   - Database Password: Generate a strong password (save this!)
   - Region: Choose closest to your users
4. **Click "Create new project"**
5. **Wait for project to be ready (2-3 minutes)**

### Step 2: Get Supabase Credentials

1. **Go to Project Settings → API**
2. **Copy the following values:**
   - Project URL
   - Anon (public) key
   - Service role key (keep this secret!)

### Step 3: Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 4: Deploy Database Schema

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref your_project_ref
   ```

4. **Push your migrations:**
   ```bash
   supabase db push
   ```

### Step 5: Configure Authentication

1. **Go to Authentication → Settings**
2. **Configure Site URL:**
   - Add your production domain (e.g., `https://your-app.vercel.app`)
   - Add your development URL (e.g., `http://localhost:3000`)

3. **Configure Redirect URLs:**
   - Add: `https://your-app.vercel.app/auth/callback`
   - Add: `http://localhost:3000/auth/callback`

### Step 6: Set Up Row Level Security (RLS)

Your migrations should have already set up RLS policies. Verify in the Supabase dashboard:

1. **Go to Authentication → Policies**
2. **Check that all tables have appropriate policies**
3. **Test with different user roles (athlete/coach)**

### Step 7: Deploy to Vercel

1. **Connect your GitHub repository to Vercel**
2. **Add environment variables in Vercel dashboard:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Deploy!**

### Step 8: Post-Deployment Setup

1. **Update Supabase Site URL to your production domain**
2. **Test authentication flow**
3. **Create test users (athlete and coach)**
4. **Verify all features work in production**

## 🔧 Troubleshooting

### Common Issues:

1. **Authentication not working:**
   - Check Site URL and Redirect URLs in Supabase
   - Verify environment variables are set correctly

2. **Database connection issues:**
   - Ensure migrations were pushed successfully
   - Check RLS policies are properly configured

3. **CORS errors:**
   - Add your domain to Supabase allowed origins
   - Check authentication settings

### Useful Commands:

```bash
# Check Supabase status
supabase status

# Reset local database
supabase db reset

# Generate types
supabase gen types typescript --local > src/types/database.ts

# View logs
supabase logs
```

## 📱 Mobile Optimization Features

The app is now optimized for mobile with:
- ✅ Responsive grid layouts
- ✅ Mobile-first navigation
- ✅ Touch-friendly buttons
- ✅ Optimized text sizes
- ✅ Mobile card layouts for tables
- ✅ Flexible spacing and padding

## 🎯 Production Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Authentication configured
- [ ] RLS policies verified
- [ ] Frontend deployed to Vercel
- [ ] Production URLs updated
- [ ] Test users created
- [ ] All features tested
- [ ] Mobile responsiveness verified

## 📞 Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Verify environment variables
3. Test authentication flow step by step
4. Check browser console for errors
