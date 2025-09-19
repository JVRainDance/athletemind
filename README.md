# AthleteMind

**Show up. Reflect. Build momentum.**

AthleteMind is a role-based SaaS platform for athletes, coaches, and parents/guardians to set goals, reflect on training, track performance, and engage in motivational gamification.

## Features

### MVP Features Implemented

#### Athlete Features
- ✅ **Training Schedule Management**: Set weekly recurring schedules and generate sessions
- ✅ **Goal Setting**: Set up to 3 goals per session, up to 7 days in advance
- ✅ **Pre-Training Check-in**: Energy and mindset ratings before sessions
- ✅ **In-Training Tracking**: Goal tracking and note-taking during sessions
- ✅ **Post-Training Reflection**: Structured reflection questions and overall rating
- ✅ **Progress Tracking**: Completion rates, streaks, goal achievement statistics
- ✅ **Session Management**: Mark absences, cancel sessions, view session history

#### Coach Features
- ✅ **Athlete Overview**: View all athletes and their completion status
- ✅ **Session Monitoring**: Track athlete session completion and progress
- ✅ **Statistics Dashboard**: Squad completion rates and performance metrics

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel
- **Authentication**: Supabase Auth with role-based access control

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd athletemind
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration file: `supabase/migrations/001_initial_schema.sql`
   - Get your project URL and anon key from Supabase dashboard

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Setup

The application uses the following main tables:

- `profiles` - User profiles with roles (athlete/coach/parent)
- `training_schedules` - Weekly recurring training schedules
- `training_sessions` - Individual training sessions
- `session_goals` - Goals for each training session
- `pre_training_checkins` - Pre-session energy/mindset ratings
- `training_notes` - Notes taken during training
- `session_reflections` - Post-session reflection responses

All tables include Row Level Security (RLS) policies for data protection.

## Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Deploy

3. **Update Supabase Settings**
   - Add your Vercel domain to Supabase Auth settings
   - Update redirect URLs in Supabase dashboard

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## User Roles

### Athlete
- Set training schedules
- Set goals for upcoming sessions
- Complete pre-training check-ins
- Track goals and take notes during training
- Complete post-training reflections
- View progress and statistics

### Coach
- View athlete overview and statistics
- Monitor session completion rates
- Track squad performance

## Key Features

### Training Flow
1. **Schedule Setup**: Athletes set their weekly training schedule
2. **Goal Setting**: Set 1-3 goals for upcoming sessions (up to 7 days ahead)
3. **Pre-Training**: Energy and mindset check-in before sessions
4. **In-Training**: Track goal progress and add categorized notes
5. **Reflection**: Answer structured questions about the session
6. **Progress**: View completion rates, streaks, and goal achievement

### Gamification Elements
- Completion streaks
- Goal achievement tracking
- Progress statistics
- Visual progress indicators

## Development Notes

### Database Rules
- All tables use Row Level Security (RLS)
- Users can only access their own data
- Coaches can view athlete data (when implemented)
- Proper foreign key relationships maintain data integrity

### Authentication
- Supabase Auth handles user authentication
- Role-based access control through profiles table
- Middleware protects dashboard routes

### UI/UX
- Mobile-first responsive design
- Clean, modern interface with Tailwind CSS
- Intuitive navigation and user flows
- Progress indicators and visual feedback

## Future Enhancements

- Parent/Guardian dashboard
- AI-powered session summaries
- Advanced reporting and analytics
- Team/squad management features
- Reward system implementation
- Mobile app (React Native)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For support or questions, please contact the development team.
