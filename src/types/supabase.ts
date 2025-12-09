export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      advance_goals: {
        Row: {
          created_at: string | null
          goal_order: number
          goal_text: string
          id: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          goal_order: number
          goal_text: string
          id?: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          goal_order?: number
          goal_text?: string
          id?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_goals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_athletes: {
        Row: {
          assigned_at: string | null
          athlete_id: string
          coach_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          athlete_id: string
          coach_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          athlete_id?: string
          coach_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_athletes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_athletes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_training_checkins: {
        Row: {
          created_at: string | null
          energy_level: number
          id: string
          mindset_level: number
          reward_criteria: string | null
          reward_earned: boolean | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          energy_level: number
          id?: string
          mindset_level: number
          reward_criteria?: string | null
          reward_earned?: boolean | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          energy_level?: number
          id?: string
          mindset_level?: number
          reward_criteria?: string | null
          reward_earned?: boolean | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_training_checkins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          setup_completed: boolean | null
          timezone: string | null
          timezone_auto_detected: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id: string
          last_name?: string | null
          role: Database["public"]["Enums"]["user_role"]
          setup_completed?: boolean | null
          timezone?: string | null
          timezone_auto_detected?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          setup_completed?: boolean | null
          timezone?: string | null
          timezone_auto_detected?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rating_themes: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          rating_labels: Json
          theme_name: string
          theme_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rating_labels: Json
          theme_name: string
          theme_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rating_labels?: Json
          theme_name?: string
          theme_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rating_themes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          reward_description: string | null
          reward_name: string
          reward_type: string
          stars_required: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reward_description?: string | null
          reward_name: string
          reward_type: string
          stars_required?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reward_description?: string | null
          reward_name?: string
          reward_type?: string
          stars_required?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_goals: {
        Row: {
          achieved: boolean | null
          created_at: string | null
          goal_text: string
          id: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          achieved?: boolean | null
          created_at?: string | null
          goal_text: string
          id?: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          achieved?: boolean | null
          created_at?: string | null
          goal_text?: string
          id?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_goals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_reflections: {
        Row: {
          created_at: string | null
          id: string
          most_proud_of: string
          overall_rating: number
          session_id: string
          updated_at: string | null
          what_didnt_go_well: string
          what_to_do_different: string
          what_went_well: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          most_proud_of: string
          overall_rating: number
          session_id: string
          updated_at?: string | null
          what_didnt_go_well: string
          what_to_do_different: string
          what_went_well: string
        }
        Update: {
          created_at?: string | null
          id?: string
          most_proud_of?: string
          overall_rating?: number
          session_id?: string
          updated_at?: string | null
          what_didnt_go_well?: string
          what_to_do_different?: string
          what_went_well?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_reflections_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_members: {
        Row: {
          athlete_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          squad_id: string
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          squad_id: string
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          squad_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          coach_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "squads_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_notes: {
        Row: {
          category: string
          created_at: string | null
          id: string
          note_text: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          note_text: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          note_text?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_schedules: {
        Row: {
          athlete_id: string
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          session_type: Database["public"]["Enums"]["session_type"] | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          session_type?: Database["public"]["Enums"]["session_type"] | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          session_type?: Database["public"]["Enums"]["session_type"] | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_schedules_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          absence_reason: string | null
          athlete_id: string
          created_at: string | null
          end_time: string
          id: string
          scheduled_date: string
          session_type: Database["public"]["Enums"]["session_type"] | null
          start_time: string
          status: Database["public"]["Enums"]["session_status"] | null
          updated_at: string | null
        }
        Insert: {
          absence_reason?: string | null
          athlete_id: string
          created_at?: string | null
          end_time: string
          id?: string
          scheduled_date: string
          session_type?: Database["public"]["Enums"]["session_type"] | null
          start_time: string
          status?: Database["public"]["Enums"]["session_status"] | null
          updated_at?: string | null
        }
        Update: {
          absence_reason?: string | null
          athlete_id?: string
          created_at?: string | null
          end_time?: string
          id?: string
          scheduled_date?: string
          session_type?: Database["public"]["Enums"]["session_type"] | null
          start_time?: string
          status?: Database["public"]["Enums"]["session_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stars: {
        Row: {
          created_at: string | null
          id: string
          reward_criteria: string | null
          session_id: string
          stars_earned: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reward_criteria?: string | null
          session_id: string
          stars_earned?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reward_criteria?: string | null
          session_id?: string
          stars_earned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stars_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_sessions: { Args: never; Returns: undefined }
      generate_sessions_from_schedules: { Args: never; Returns: undefined }
    }
    Enums: {
      session_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "absent"
      session_type: "regular" | "competition" | "extra"
      user_role: "athlete" | "coach" | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      session_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "absent",
      ],
      session_type: ["regular", "competition", "extra"],
      user_role: ["athlete", "coach", "parent"],
    },
  },
} as const
