import { createClient } from '@/lib/supabase-client'

export function setupAuthListener() {
  const supabase = createClient()

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
      console.log('User signed in with confirmed email:', session.user.email)
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single()

      if (!existingProfile) {
        console.log('Creating profile for confirmed user...')
        
        // Get pending profile data from localStorage
        const pendingProfile = localStorage.getItem('pendingProfile')
        let firstName = 'User'
        let lastName = null
        let role = 'athlete'

        if (pendingProfile) {
          try {
            const { firstName: storedFirstName, lastName: storedLastName, role: storedRole } = JSON.parse(pendingProfile)
            firstName = storedFirstName || 'User'
            lastName = storedLastName || null
            role = storedRole || 'athlete'
          } catch (error) {
            console.error('Error parsing pending profile:', error)
          }
        }

        // Create profile after confirmation
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            first_name: firstName,
            last_name: lastName,
            role,
          })
        
        if (error) {
          console.error('Error creating profile:', error)
        } else {
          console.log('Profile created successfully')
          
          // Clear pending profile data
          localStorage.removeItem('pendingProfile')
          
          // Generate sessions for new athletes
          if (role === 'athlete') {
            try {
              const { generateSessionsForAthlete } = await import('@/lib/session-generation')
              await generateSessionsForAthlete(session.user.id)
              console.log('Sessions generated for new athlete')
            } catch (error) {
              console.error('Error generating sessions for new athlete:', error)
            }
          }
        }
      } else {
        console.log('Profile already exists for user')
      }
    }
  })
}
