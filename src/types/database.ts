export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string | null
          role: 'athlete' | 'coach' | 'parent'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name?: string | null
          role: 'athlete' | 'coach' | 'parent'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string | null
          role?: 'athlete' | 'coach' | 'parent'
          created_at?: string
          updated_at?: string
        }
      }
      training_schedules: {
        Row: {
          id: string
          athlete_id: string
          day_of_week: number // 0 = Sunday, 1 = Monday, etc.
          start_time: string
          end_time: string
          session_type: 'regular' | 'competition' | 'extra'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          day_of_week: number
          start_time: string
          end_time: string
          session_type?: 'regular' | 'competition' | 'extra'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          session_type?: 'regular' | 'competition' | 'extra'
          created_at?: string
          updated_at?: string
        }
      }
      training_sessions: {
        Row: {
          id: string
          athlete_id: string
          scheduled_date: string
          start_time: string
          end_time: string
          session_type: 'regular' | 'competition' | 'extra'
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'absent'
          absence_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          scheduled_date: string
          start_time: string
          end_time: string
          session_type?: 'regular' | 'competition' | 'extra'
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'absent'
          absence_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          scheduled_date?: string
          start_time?: string
          end_time?: string
          session_type?: 'regular' | 'competition' | 'extra'
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'absent'
          absence_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      session_goals: {
        Row: {
          id: string
          session_id: string
          goal_text: string
          achieved: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          goal_text: string
          achieved?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          goal_text?: string
          achieved?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      pre_training_checkins: {
        Row: {
          id: string
          session_id: string
          energy_level: number // 1-5 rating
          mindset_level: number // 1-5 rating
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          energy_level: number
          mindset_level: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          energy_level?: number
          mindset_level?: number
          created_at?: string
          updated_at?: string
        }
      }
      training_notes: {
        Row: {
          id: string
          session_id: string
          note_text: string
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          note_text: string
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          note_text?: string
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      session_reflections: {
        Row: {
          id: string
          session_id: string
          what_went_well: string
          what_didnt_go_well: string
          what_to_do_different: string
          most_proud_of: string
          overall_rating: number // 1-5 rating
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          what_went_well: string
          what_didnt_go_well: string
          what_to_do_different: string
          most_proud_of: string
          overall_rating: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          what_went_well?: string
          what_didnt_go_well?: string
          what_to_do_different?: string
          most_proud_of?: string
          overall_rating?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
