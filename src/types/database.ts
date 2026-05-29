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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      league_members: {
        Row: {
          joined_at: string
          league_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          league_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          league_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          invite_code: string
          is_public: boolean
          max_members: number
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          invite_code?: string
          is_public?: boolean
          max_members?: number
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          invite_code?: string
          is_public?: boolean
          max_members?: number
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leagues_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: number | null
          home_score: number | null
          home_team_id: number | null
          id: number
          match_number: number
          phase: Database["public"]["Enums"]["match_phase"]
          result_source: string | null
          result_updated_at: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["match_status"]
          venue: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: number | null
          home_score?: number | null
          home_team_id?: number | null
          id?: number
          match_number: number
          phase: Database["public"]["Enums"]["match_phase"]
          result_source?: string | null
          result_updated_at?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["match_status"]
          venue?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: number | null
          home_score?: number | null
          home_team_id?: number | null
          id?: number
          match_number?: number
          phase?: Database["public"]["Enums"]["match_phase"]
          result_source?: string | null
          result_updated_at?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["match_status"]
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          away_score: number
          created_at: string
          home_score: number
          id: number
          match_id: number
          outcome: Database["public"]["Enums"]["prediction_outcome"]
          points_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          away_score: number
          created_at?: string
          home_score: number
          id?: number
          match_id: number
          outcome?: Database["public"]["Enums"]["prediction_outcome"]
          points_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          away_score?: number
          created_at?: string
          home_score?: number
          id?: number
          match_id?: number
          outcome?: Database["public"]["Enums"]["prediction_outcome"]
          points_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          correct_predictions: number
          created_at: string
          display_name: string
          exact_predictions: number
          global_rank: number | null
          id: string
          total_points: number
          total_predictions: number
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          correct_predictions?: number
          created_at?: string
          display_name: string
          exact_predictions?: number
          global_rank?: number | null
          id: string
          total_points?: number
          total_predictions?: number
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          correct_predictions?: number
          created_at?: string
          display_name?: string
          exact_predictions?: number
          global_rank?: number | null
          id?: string
          total_points?: number
          total_predictions?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      result_audit_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: number
          match_id: number
          new_away: number
          new_home: number
          previous_away: number | null
          previous_home: number | null
          source: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: number
          match_id: number
          new_away: number
          new_home: number
          previous_away?: number | null
          previous_home?: number | null
          source: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: number
          match_id?: number
          new_away?: number
          new_home?: number
          previous_away?: number | null
          previous_home?: number | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "result_audit_log_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_rules: {
        Row: {
          description: string | null
          id: number
          outcome: Database["public"]["Enums"]["prediction_outcome"]
          points: number
        }
        Insert: {
          description?: string | null
          id?: number
          outcome: Database["public"]["Enums"]["prediction_outcome"]
          points: number
        }
        Update: {
          description?: string | null
          id?: number
          outcome?: Database["public"]["Enums"]["prediction_outcome"]
          points?: number
        }
        Relationships: []
      }
      teams: {
        Row: {
          code: string
          flag_url: string | null
          group_name: string | null
          id: number
          name: string
        }
        Insert: {
          code: string
          flag_url?: string | null
          group_name?: string | null
          id?: number
          name: string
        }
        Update: {
          code?: string
          flag_url?: string | null
          group_name?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      match_phase:
        | "group"
        | "round_of_16"
        | "quarterfinal"
        | "semifinal"
        | "third_place"
        | "final"
      match_status: "scheduled" | "live" | "finished" | "cancelled"
      prediction_outcome: "exact" | "correct" | "incorrect" | "pending"
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
      match_phase: [
        "group",
        "round_of_16",
        "quarterfinal",
        "semifinal",
        "third_place",
        "final",
      ],
      match_status: ["scheduled", "live", "finished", "cancelled"],
      prediction_outcome: ["exact", "correct", "incorrect", "pending"],
    },
  },
} as const

