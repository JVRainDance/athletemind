'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatTime } from '@/lib/utils'
import { CheckCircle, Plus, MessageSquare, Target, Clock } from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

interface Goal {
  id: string
  goal_text: string
  achieved: boolean | null
}

interface Note {
  id: string
  note_text: string
  category: string
  created_at: string
}

export default function TrainingPage({ params }: PageProps) {
  const [session, setSession] = useState<any>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState({ text: '', category: '' })
  const [timeRemaining, setTimeRemaining] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchSessionData()
    
    // Update time remaining every minute
    const interval = setInterval(updateTimeRemaining, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchSessionData = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) {
        router.push('/auth/login')
        return
      }

      // Fetch session details
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

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('session_goals')
        .select('*')
        .eq('session_id', params.id)
        .order('created_at')

      setGoals(goalsData || [])

      // Fetch notes
      const { data: notesData } = await supabase
        .from('training_notes')
        .select('*')
        .eq('session_id', params.id)
        .order('created_at')

      setNotes(notesData || [])

      updateTimeRemaining()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTimeRemaining = () => {
    if (!session) return

    const now = new Date()
    const endTime = new Date(`${session.scheduled_date}T${session.end_time}`)
    const diff = endTime.getTime() - now.getTime()

    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setTimeRemaining(`${hours}h ${minutes}m`)
    } else {
      setTimeRemaining('Session ended')
    }
  }

  const handleGoalToggle = async (goalId: string, achieved: boolean) => {
    try {
      const { error } = await supabase
        .from('session_goals')
        .update({ achieved })
        .eq('id', goalId)

      if (error) {
        console.error('Error updating goal:', error)
      } else {
        setGoals(goals.map(goal => 
          goal.id === goalId ? { ...goal, achieved } : goal
        ))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newNote.text.trim() || !newNote.category.trim()) {
      alert('Please fill in both note text and category.')
      return
    }

    try {
      const { error } = await supabase
        .from('training_notes')
        .insert({
          session_id: params.id,
          note_text: newNote.text,
          category: newNote.category
        })

      if (error) {
        console.error('Error adding note:', error)
        alert('Error adding note. Please try again.')
      } else {
        setNewNote({ text: '', category: '' })
        setShowAddNote(false)
        fetchSessionData()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred.')
    }
  }

  const handleCompleteTraining = () => {
    router.push(`/dashboard/athlete/sessions/${params.id}/reflection`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-600">Session not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Training Session</h1>
            <p className="text-gray-600">
              {new Date(session.scheduled_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
            </div>
            <div className="text-lg font-semibold text-primary-600">
              {timeRemaining}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Session Progress</span>
          <span className="text-sm text-gray-500">{timeRemaining}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
            style={{ 
              width: session.status === 'completed' ? '100%' : 
                     session.status === 'in_progress' ? '50%' : '0%' 
            }}
          />
        </div>
      </div>

      {/* Goals */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Training Goals</h2>
          <Target className="h-5 w-5 text-gray-400" />
        </div>
        
        {goals.length > 0 ? (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleGoalToggle(goal.id, !goal.achieved)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    goal.achieved 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300 hover:border-green-500'
                  }`}
                >
                  {goal.achieved && <CheckCircle className="h-4 w-4" />}
                </button>
                <p className={`flex-1 text-sm ${goal.achieved ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                  {goal.goal_text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Target className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No goals set for this session</p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Training Notes</h2>
          <button
            onClick={() => setShowAddNote(!showAddNote)}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </button>
        </div>

        {/* Add Note Form */}
        {showAddNote && (
          <form onSubmit={handleAddNote} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <input
                  type="text"
                  value={newNote.category}
                  onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                  placeholder="e.g., High Bar, Vault, Mindset"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Note
                </label>
                <textarea
                  value={newNote.text}
                  onChange={(e) => setNewNote({...newNote, text: e.target.value})}
                  placeholder="Add your training notes here..."
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddNote(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded"
                >
                  Add Note
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Notes List */}
        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="border-l-4 border-primary-200 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {note.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{note.note_text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <MessageSquare className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No notes yet</p>
          </div>
        )}
      </div>

      {/* Complete Training Button */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Ready to complete your training session?
          </p>
          <button
            onClick={handleCompleteTraining}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-secondary-600 hover:bg-secondary-700"
          >
            Complete Training & Reflect
          </button>
        </div>
      </div>
    </div>
  )
}
