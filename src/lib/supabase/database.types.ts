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
      admins: {
        Row: {
          added_at: string
          added_by: string | null
          person_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          person_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admins_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_submissions: {
        Row: {
          answers: Json
          created_at: string
          email: string
          first_name: string
          last_name: string
          submission_id: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          email: string
          first_name: string
          last_name: string
          submission_id: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          created_at?: string
          email?: string
          first_name?: string
          last_name?: string
          submission_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_tags: {
        Row: {
          added_at: string
          added_by: string | null
          person_id: string
          tag_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          person_id: string
          tag_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          person_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_tags_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_tags_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          join_emails: boolean
          joined_at: string
          person_id: string
        }
        Insert: {
          created_at?: string
          join_emails?: boolean
          joined_at?: string
          person_id: string
        }
        Update: {
          created_at?: string
          join_emails?: boolean
          joined_at?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          bounce_detail: string | null
          bounced_at: string | null
          created_at: string
          email: string
          first_name: string | null
          first_signed_in_at: string | null
          full_name: string | null
          id: string
          last_name: string | null
          last_signed_in_at: string | null
          unsubscribe_reason: string | null
          unsubscribe_token: string
          unsubscribed_at: string | null
          user_id: string | null
        }
        Insert: {
          bounce_detail?: string | null
          bounced_at?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          first_signed_in_at?: string | null
          full_name?: never
          id?: string
          last_name?: string | null
          last_signed_in_at?: string | null
          unsubscribe_reason?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Update: {
          bounce_detail?: string | null
          bounced_at?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          first_signed_in_at?: string | null
          full_name?: never
          id?: string
          last_name?: string | null
          last_signed_in_at?: string | null
          unsubscribe_reason?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          referred_email: string
          referred_id: string | null
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          referred_email: string
          referred_id?: string | null
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          referred_email?: string
          referred_id?: string | null
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email_hash: string
          reason: string
        }
        Insert: {
          created_at?: string
          email_hash: string
          reason: string
        }
        Update: {
          created_at?: string
          email_hash?: string
          reason?: string
        }
        Relationships: []
      }
      tag_events: {
        Row: {
          at: string
          by_person_id: string | null
          id: number
          kind: string
          person_id: string
          tag_id: string | null
          tag_name: string
        }
        Insert: {
          at?: string
          by_person_id?: string | null
          id?: number
          kind: string
          person_id: string
          tag_id?: string | null
          tag_name: string
        }
        Update: {
          at?: string
          by_person_id?: string | null
          id?: number
          kind?: string
          person_id?: string
          tag_id?: string | null
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_events_by_person_id_fkey"
            columns: ["by_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_events_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_admin: {
        Args: { p_email: string; p_full_name: string }
        Returns: boolean
      }
      add_member: {
        Args: {
          p_email: string
          p_full_name: string
          p_join_emails?: boolean
          p_joined_at?: string
        }
        Returns: string
      }
      apply_suppression: { Args: { p_person_id: string }; Returns: undefined }
      can_email: { Args: { p_person_id: string }; Returns: boolean }
      can_sign_in: {
        Args: { p_email: string; p_portal: string }
        Returns: boolean
      }
      create_tag: { Args: { p_name: string }; Returns: string }
      current_person_id: { Args: never; Returns: string }
      delete_tag: { Args: { p_tag_id: string }; Returns: string }
      email_hash: { Args: { p_email: string }; Returns: string }
      import_unsubscribes: {
        Args: { p_emails: string[] }
        Returns: {
          already: number
          remembered: number
          unsubscribed: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      recheck_member: { Args: { p_person_id: string }; Returns: undefined }
      record_email_event: {
        Args: { p_detail?: string; p_email: string; p_kind: string }
        Returns: undefined
      }
      record_sign_in: { Args: never; Returns: boolean }
      remove_admin: { Args: { p_person_id: string }; Returns: string }
      remove_member: { Args: { p_person_id: string }; Returns: undefined }
      rename_tag: { Args: { p_name: string; p_tag_id: string }; Returns: string }
      resubscribe_by_token: { Args: { p_token: string }; Returns: string }
      split_name: {
        Args: { p_full_name: string }
        Returns: Record<string, unknown>
      }
      submit_intake: {
        Args: {
          p_answers: Json
          p_email: string
          p_first_name: string
          p_last_name: string
          p_submission_id: string
        }
        Returns: undefined
      }
      tag_members: {
        Args: { p_person_ids: string[]; p_tag_id: string }
        Returns: number
      }
      unsubscribe_by_token: { Args: { p_token: string }; Returns: string }
      unsubscribe_member: { Args: { p_person_id: string }; Returns: undefined }
      untag_members: {
        Args: { p_person_ids: string[]; p_tag_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
