# Production Configuration

## Environment Variables Required

Create a `.env.local` file with these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Example Values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add the environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Supabase Configuration

1. Set Site URL to your production domain
2. Add redirect URLs for authentication
3. Configure RLS policies for production
