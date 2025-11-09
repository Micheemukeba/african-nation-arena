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
      goal_events: {
        Row: {
          created_at: string | null
          id: string
          match_id: string
          minute: number
          player_id: string
          team_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id: string
          minute: number
          player_id: string
          team_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string
          minute?: number
          player_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          commentary: string | null
          created_at: string | null
          id: string
          match_type: Database["public"]["Enums"]["match_type"] | null
          played_at: string | null
          stage: Database["public"]["Enums"]["match_stage"]
          team1_id: string
          team1_score: number | null
          team2_id: string
          team2_score: number | null
          tournament_id: string
          winner_id: string | null
        }
        Insert: {
          commentary?: string | null
          created_at?: string | null
          id?: string
          match_type?: Database["public"]["Enums"]["match_type"] | null
          played_at?: string | null
          stage: Database["public"]["Enums"]["match_stage"]
          team1_id: string
          team1_score?: number | null
          team2_id: string
          team2_score?: number | null
          tournament_id: string
          winner_id?: string | null
        }
        Update: {
          commentary?: string | null
          created_at?: string | null
          id?: string
          match_type?: Database["public"]["Enums"]["match_type"] | null
          played_at?: string | null
          stage?: Database["public"]["Enums"]["match_stage"]
          team1_id?: string
          team1_score?: number | null
          team2_id?: string
          team2_score?: number | null
          tournament_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string | null
          goals_scored: number | null
          id: string
          is_captain: boolean | null
          name: string
          natural_position: Database["public"]["Enums"]["player_position"]
          rating_at: number
          rating_df: number
          rating_gk: number
          rating_md: number
          team_id: string
          total_minutes_played: number | null
        }
        Insert: {
          created_at?: string | null
          goals_scored?: number | null
          id?: string
          is_captain?: boolean | null
          name: string
          natural_position: Database["public"]["Enums"]["player_position"]
          rating_at: number
          rating_df: number
          rating_gk: number
          rating_md: number
          team_id: string
          total_minutes_played?: number | null
        }
        Update: {
          created_at?: string | null
          goals_scored?: number | null
          id?: string
          is_captain?: boolean | null
          name?: string
          natural_position?: Database["public"]["Enums"]["player_position"]
          rating_at?: number
          rating_df?: number
          rating_gk?: number
          rating_md?: number
          team_id?: string
          total_minutes_played?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          country_name: string
          created_at: string | null
          id: string
          manager_name: string
          representative_id: string | null
          representative_name: string
          team_rating: number | null
          updated_at: string | null
        }
        Insert: {
          country_name: string
          created_at?: string | null
          id?: string
          manager_name: string
          representative_id?: string | null
          representative_name: string
          team_rating?: number | null
          updated_at?: string | null
        }
        Update: {
          country_name?: string
          created_at?: string | null
          id?: string
          manager_name?: string
          representative_id?: string | null
          representative_name?: string
          team_rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_stage: Database["public"]["Enums"]["match_stage"] | null
          id: string
          name: string
          started_at: string | null
          status: Database["public"]["Enums"]["tournament_status"] | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_stage?: Database["public"]["Enums"]["match_stage"] | null
          id?: string
          name: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"] | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_stage?: Database["public"]["Enums"]["match_stage"] | null
          id?: string
          name?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"] | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "federation_representative"
      match_stage: "quarter_final" | "semi_final" | "final"
      match_type: "played" | "simulated"
      player_position: "GK" | "DF" | "MD" | "AT"
      tournament_status: "registration" | "in_progress" | "completed"
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
      app_role: ["admin", "federation_representative"],
      match_stage: ["quarter_final", "semi_final", "final"],
      match_type: ["played", "simulated"],
      player_position: ["GK", "DF", "MD", "AT"],
      tournament_status: ["registration", "in_progress", "completed"],
    },
  },
} as const
