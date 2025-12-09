'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'
import { CheckCircle, Clock, Target, Star, Plus, MessageSquare, ArrowRight } from 'lucide-react'
import BackButton from '@/components/BackButton'

type Session = Database['public']['Tables']['training_sessions']['Row']
type Goal = Database['public']['Tables']['session_goals']['Row']
type Note = Database['public']['Tables']['training_notes']['Row']

interface PageProps {
  params: {
    id: string
  }
}

export default function TrainingPage({ params }: PageProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [session, setSession] = useState<Session | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [newNote, setNewNote] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [showAddNote, setShowAddNote] = useState(false)
  
  // Time tracking
  const [sessionProgress, setSessionProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    loadSessionData()
    const interval = setInterval(updateSessionProgress, 1000)
    return () => clearInterval(interval)
  }, [params.id])

  useEffect(() => {
    // Update session status to in_progress when training page loads
    if (session && session.status === 'scheduled') {
      updateSessionStatus()
    }
  }, [session])

  const loadSessionData = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) {
        router.push('/auth/login')
        return
      }

      // Load session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', params.id)
        .eq('athlete_id', authSession.user.id)
        .single()

      if (sessionError || !sessionData) {
        router.push('/dashboard/athlete/sessions')
        return
      }

      setSession(sessionData)

      // Load goals
      const { data: goalsData } = await supabase
        .from('session_goals')
        .select('*')
        .eq('session_id', params.id)
        .order('created_at')

      setGoals(goalsData || [])

      // Load notes
      const { data: notesData } = await supabase
        .from('training_notes')
        .select('*')
        .eq('session_id', params.id)
        .order('created_at')

      setNotes(notesData || [])

    } catch (error) {
      console.error('Error loading session data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSessionStatus = async () => {
    if (!session) return

    try {
      const { error } = await supabase
        .from('training_sessions')
        .update({ status: 'in_progress' })
        .eq('id', session.id)

      if (error) {
        console.error('Error updating session status:', error)
      } else {
        // Update local state
        setSession(prev => prev ? { ...prev, status: 'in_progress' } : null)
      }
    } catch (error) {
      console.error('Error updating session status:', error)
    }
  }

  const updateSessionProgress = () => {
    if (!session) return

    const sessionStart = new Date(`${session.scheduled_date}T${session.start_time}`)
    const sessionEnd = new Date(`${session.scheduled_date}T${session.end_time}`)
    const now = new Date()

    const totalDuration = sessionEnd.getTime() - sessionStart.getTime()
    const elapsed = now.getTime() - sessionStart.getTime()
    
    if (elapsed < 0) {
      // Session hasn't started yet
      setSessionProgress(0)
      const timeUntilStart = Math.abs(elapsed)
      const minutes = Math.floor(timeUntilStart / (1000 * 60))
      const seconds = Math.floor((timeUntilStart % (1000 * 60)) / 1000)
      setTimeRemaining(`Starts in ${minutes}:${seconds.toString().padStart(2, '0')}`)
    } else if (elapsed >= totalDuration) {
      // Session has ended
      setSessionProgress(100)
      setTimeRemaining('Session completed')
    } else {
      // Session in progress
      const progress = (elapsed / totalDuration) * 100
      setSessionProgress(progress)
      
      const remaining = sessionEnd.getTime() - now.getTime()
      const minutes = Math.floor(remaining / (1000 * 60))
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')} remaining`)
    }
  }

  const toggleGoalAchievement = async (goalId: string, currentAchieved: boolean | null) => {
    try {
      const newAchieved = currentAchieved === true ? null : true
      
      const { error } = await supabase
        .from('session_goals')
        .update({ achieved: newAchieved })
        .eq('id', goalId)

      if (error) {
        console.error('Error updating goal:', error)
        return
      }

      // Update local state
      setGoals(goals.map(goal => 
        goal.id === goalId ? { ...goal, achieved: newAchieved } : goal
      ))

      // Show celebration for achieved goals
      if (newAchieved) {
        // You could add confetti animation here
        console.log('Goal achieved! 🎉')
      }

    } catch (error) {
      console.error('Error toggling goal:', error)
    }
  }

  const addNote = async () => {
    if (!newNote.trim() || !newCategory.trim()) return

    try {
      const { data, error } = await supabase
        .from('training_notes')
        .insert({
          session_id: params.id,
          note_text: newNote.trim(),
          category: newCategory.trim()
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding note:', error)
        return
      }

      setNotes([...notes, data])
      setNewNote('')
      setNewCategory('')
      setShowAddNote(false)

    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading training session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Session not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <BackButton />
        </div>
      </div>
      
      {/* Header with Progress Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formatDate(session.scheduled_date)}
              </h1>
              <p className="text-primary-600 font-medium">
                {formatTime(session.start_time)} - {formatTime(session.end_time)}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                {timeRemaining}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(0, Math.min(100, sessionProgress))}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Goals Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Target className="h-5 w-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Training Goals</h2>
            </div>
            
            <div className="space-y-3">
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200">
                  <button
                    onClick={() => toggleGoalAchievement(goal.id, goal.achieved)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      goal.achieved === true
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {goal.achieved === true && <CheckCircle className="h-4 w-4" />}
                  </button>
                  <p className={`flex-1 text-sm ${
                    goal.achieved === true ? 'text-green-700 line-through' : 'text-gray-700'
                  }`}>
                    {goal.goal_text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Training Notes</h2>
              </div>
              <button
                onClick={() => setShowAddNote(!showAddNote)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </button>
            </div>

            {/* Add Note Form */}
            {showAddNote && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Category (e.g., High Bar, Vault, Mindset)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add your training note..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={addNote}
                      className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
                    >
                      Save Note
                    </button>
                    <button
                      onClick={() => {
                        setShowAddNote(false)
                        setNewNote('')
                        setNewCategory('')
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notes List */}
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="border-l-4 border-primary-200 pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {note.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {note.created_at ? new Date(note.created_at).toLocaleTimeString() : 'Unknown time'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{note.note_text}</p>
                </div>
              ))}
              
              {notes.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No notes yet. Add your first training note above!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Complete Training Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push(`/dashboard/athlete/sessions/${params.id}/reflection`)}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Complete Training
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  )
}