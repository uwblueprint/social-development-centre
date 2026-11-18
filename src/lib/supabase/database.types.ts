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
      automatic_emails: {
        Row: {
          alert_enabled: boolean
          alert_to: string | null
          alert_when: string
          body: Json
          conditions: Json
          created_at: string
          created_by: string | null
          delay_amount: number
          delay_unit: string
          id: string
          mode: string
          name: string
          published_at: string | null
          state: string
          subject: string
          subject_doc: Json
          trigger: string
          trigger_tag_id: string | null
          updated_at: string
        }
        Insert: {
          alert_enabled?: boolean
          alert_to?: string | null
          alert_when?: string
          body?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          delay_amount?: number
          delay_unit?: string
          id?: string
          mode?: string
          name?: string
          published_at?: string | null
          state?: string
          subject?: string
          subject_doc?: Json
          trigger?: string
          trigger_tag_id?: string | null
          updated_at?: string
        }
        Update: {
          alert_enabled?: boolean
          alert_to?: string | null
          alert_when?: string
          body?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          delay_amount?: number
          delay_unit?: string
          id?: string
          mode?: string
          name?: string
          published_at?: string | null
          state?: string
          subject?: string
          subject_doc?: Json
          trigger?: string
          trigger_tag_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automatic_emails_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automatic_emails_trigger_tag_id_fkey"
            columns: ["trigger_tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      email_fallbacks: {
        Row: {
          field: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          field: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          field?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_fallbacks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      email_occurrences: {
        Row: {
          automatic_email_id: string
          context: Json
          created_at: string
          due_on: string
          event_at: string
          id: string
          key: string
          missed: boolean
          person_id: string
          resolved_at: string | null
          status: string
          trigger: string
        }
        Insert: {
          automatic_email_id: string
          context?: Json
          created_at?: string
          due_on: string
          event_at: string
          id?: string
          key: string
          missed?: boolean
          person_id: string
          resolved_at?: string | null
          status?: string
          trigger: string
        }
        Update: {
          automatic_email_id?: string
          context?: Json
          created_at?: string
          due_on?: string
          event_at?: string
          id?: string
          key?: string
          missed?: boolean
          person_id?: string
          resolved_at?: string | null
          status?: string
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_occurrences_automatic_email_id_fkey"
            columns: ["automatic_email_id"]
            isOneToOne: false
            referencedRelation: "automatic_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_occurrences_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attempts: number
          automatic_email_id: string
          body_override: Json | null
          created_at: string
          due_on: string
          edited_at: string | null
          edited_by: string | null
          id: string
          last_error: string | null
          not_sent_reason: string | null
          occurrence_id: string
          person_id: string
          provider_message_id: string | null
          sent_at: string | null
          status: string
          subject_override: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attempts?: number
          automatic_email_id: string
          body_override?: Json | null
          created_at?: string
          due_on: string
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          last_error?: string | null
          not_sent_reason?: string | null
          occurrence_id: string
          person_id: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          subject_override?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attempts?: number
          automatic_email_id?: string
          body_override?: Json | null
          created_at?: string
          due_on?: string
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          last_error?: string | null
          not_sent_reason?: string | null
          occurrence_id?: string
          person_id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          subject_override?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_automatic_email_id_fkey"
            columns: ["automatic_email_id"]
            isOneToOne: false
            referencedRelation: "automatic_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "email_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
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
          form_source: string | null
          last_name: string
          submission_id: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          email: string
          first_name: string
          form_source?: string | null
          last_name: string
          submission_id: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          created_at?: string
          email?: string
          first_name?: string
          form_source?: string | null
          last_name?: string
          submission_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          active_ms: number
          answers: Json
          created_at: string
          first_answer_ms: number | null
          from: string | null
          id: number
          key_id: string | null
          last_answer_ms: number | null
          left_via: string
          page_key: string
          person_id: string
          total_ms: number
          user_found: boolean | null
        }
        Insert: {
          active_ms: number
          answers?: Json
          created_at?: string
          first_answer_ms?: number | null
          from?: string | null
          id?: never
          key_id?: string | null
          last_answer_ms?: number | null
          left_via: string
          page_key: string
          person_id: string
          total_ms: number
          user_found?: boolean | null
        }
        Update: {
          active_ms?: number
          answers?: Json
          created_at?: string
          first_answer_ms?: number | null
          from?: string | null
          id?: never
          key_id?: string | null
          last_answer_ms?: number | null
          left_via?: string
          page_key?: string
          person_id?: string
          total_ms?: number
          user_found?: boolean | null
        }
        Relationships: []
      }
      member_events: {
        Row: {
          at: string
          created_at: string
          id: number
          join_emails: boolean | null
          kind: string
          person_id: string
          referral_id: string | null
          tag_id: string | null
          tag_name: string | null
        }
        Insert: {
          at: string
          created_at?: string
          id?: never
          join_emails?: boolean | null
          kind: string
          person_id: string
          referral_id?: string | null
          tag_id?: string | null
          tag_name?: string | null
        }
        Update: {
          at?: string
          created_at?: string
          id?: never
          join_emails?: boolean | null
          kind?: string
          person_id?: string
          referral_id?: string | null
          tag_id?: string | null
          tag_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_events_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_events_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      member_note_revisions: {
        Row: {
          body: string
          id: number
          note_id: string
          written_at: string
          written_by: string | null
        }
        Insert: {
          body: string
          id?: never
          note_id: string
          written_at: string
          written_by?: string | null
        }
        Update: {
          body?: string
          id?: never
          note_id?: string
          written_at?: string
          written_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_note_revisions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "member_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_note_revisions_written_by_fkey"
            columns: ["written_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      member_notes: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          person_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          person_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          person_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_notes_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_notes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_notes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
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
          referred_first_name: string | null
          referred_last_name: string | null
          referred_id: string | null
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          referred_email: string
          referred_first_name?: string | null
          referred_last_name?: string | null
          referred_id?: string | null
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          referred_email?: string
          referred_first_name?: string | null
          referred_last_name?: string | null
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
      subscription_events: {
        Row: {
          at: string
          detail: string | null
          id: number
          kind: string
          person_id: string
        }
        Insert: {
          at?: string
          detail?: string | null
          id?: never
          kind: string
          person_id: string
        }
        Update: {
          at?: string
          detail?: string | null
          id?: never
          kind?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_person_id_fkey"
            columns: ["person_id"]
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
      member_email_history: {
        Row: {
          automatic_email_id: string | null
          could_not_send: boolean | null
          edited: boolean | null
          email_name: string | null
          not_sent_reason: string | null
          one_off_email_id: string | null
          person_id: string | null
          send_at: string | null
          send_id: string | null
          sent_at: string | null
          started_at: string | null
          started_by: string | null
          started_by_tag: string | null
          status: string | null
          subject: string | null
        }
        Relationships: []
      }
      member_timeline: {
        Row: {
          at: string | null
          body: string | null
          by_person_id: string | null
          edited: boolean | null
          email_status: string | null
          kind: string | null
          note_id: string | null
          person_id: string | null
          referral_id: string | null
          send_id: string | null
          tag_name: string | null
        }
        Relationships: []
      }
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
      add_members: {
        Args: { p_join_emails?: boolean; p_joined_at?: string; p_members: Json }
        Returns: {
          email: string
          result: string
        }[]
      }
      add_note: { Args: { p_body: string; p_person_id: string }; Returns: string }
      add_referral: {
        Args: { p_email: string; p_full_name?: string; p_referrer_id: string }
        Returns: string
      }
      admin_signed_in_at: { Args: never; Returns: string }
      apply_suppression: { Args: { p_person_id: string }; Returns: undefined }
      can_email: { Args: { p_person_id: string }; Returns: boolean }
      can_sign_in: {
        Args: { p_email: string; p_portal: string }
        Returns: boolean
      }
      create_tag: { Args: { p_name: string }; Returns: string }
      current_person_id: { Args: never; Returns: string }
      delete_note: { Args: { p_note_id: string }; Returns: undefined }
      delete_tag: { Args: { p_tag_id: string }; Returns: string }
      edit_note: {
        Args: { p_body: string; p_note_id: string }
        Returns: undefined
      }
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
      record_intake_page_visit: {
        Args: {
          p_active_ms: number
          p_answers: Json
          p_first_answer_ms: number | null
          p_from: string
          p_key_id: string | null
          p_last_answer_ms: number | null
          p_left_via: string
          p_page_key: string
          p_person_id: string
          p_total_ms: number
        }
        Returns: undefined
      }
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
          p_form_source: string
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
      update_own_name: {
        Args: { p_first_name: string; p_last_name: string }
        Returns: undefined
      }
      approve_send: {
        Args: { p_occurrence_id: string; p_person_id: string }
        Returns: undefined
      }
      assert_in_outbox: {
        Args: { p_occurrence_id: string; p_person_id: string }
        Returns: undefined
      }
      automatic_email_due_on: {
        Args: { p_amount: number; p_event_at: string; p_unit: string }
        Returns: string
      }
      automatic_email_eligible: {
        Args: { p_email_id: string }
        Returns: {
          email: string
          full_name: string
          person_id: string
        }[]
      }
      automatic_email_matches: {
        Args: { p_email_id: string; p_person_id: string }
        Returns: boolean
      }
      create_automatic_email: { Args: never; Returns: string }
      duplicate_automatic_email: { Args: { p_id: string }; Returns: string }
      edit_send: {
        Args: {
          p_body: Json
          p_occurrence_id: string
          p_person_id: string
          p_subject: string
        }
        Returns: undefined
      }
      email_deliveries: {
        Args: never
        Returns: {
          body: Json
          fields: Json
          send_id: string
          subject: string
          subject_doc: Json
          to_email: string
          unsubscribe_token: string
        }[]
      }
      email_doc_is_empty: { Args: { p_doc: Json }; Returns: boolean }
      email_field_available: {
        Args: { p_id: string; p_trigger: string }
        Returns: boolean
      }
      email_personalized_ids: { Args: { p_doc: Json }; Returns: string[] }
      outbox_upcoming: {
        Args: { p_days?: number }
        Returns: {
          automatic_email_id: string
          due_on: string
          edited: boolean
          email: string
          email_name: string
          full_name: string
          missed: boolean
          occurrence_id: string
          person_id: string
          status: string
          subject: string
        }[]
      }
      prepare_due_sends: { Args: { p_today?: string }; Returns: number }
      publish_automatic_email: { Args: { p_id: string }; Returns: string[] }
      queue_occurrences: {
        Args: {
          p_context: Json
          p_event_at: string
          p_key: string
          p_person_id: string
          p_tag_id: string
          p_triggers: string[]
        }
        Returns: undefined
      }
      record_send_result: {
        Args: {
          p_error: string | null
          p_provider_message_id: string | null
          p_send_id: string
        }
        Returns: undefined
      }
      restore_automatic_email: { Args: { p_id: string }; Returns: undefined }
      save_automatic_email: {
        Args: { p_id: string; p_patch: Json }
        Returns: undefined
      }
      set_email_fallback: {
        Args: { p_field: string; p_value: string }
        Returns: undefined
      }
      toronto_today: { Args: never; Returns: string }
      trash_automatic_email: { Args: { p_id: string }; Returns: undefined }
      unpublish_automatic_email: { Args: { p_id: string }; Returns: undefined }
      validate_conditions: { Args: { p: Json }; Returns: undefined }
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
