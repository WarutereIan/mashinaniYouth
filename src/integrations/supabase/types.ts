export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string;
          role: Database["public"]["Enums"]["admin_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role: Database["public"]["Enums"]["admin_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: Database["public"]["Enums"]["admin_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          action: string;
          actor_user_id: string | null;
          after: Json | null;
          before: Json | null;
          created_at: string;
          id: number;
          ip: unknown;
          target_id: string | null;
          target_type: string | null;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          id?: number;
          ip?: unknown;
          target_id?: string | null;
          target_type?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          id?: number;
          ip?: unknown;
          target_id?: string | null;
          target_type?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      candidates: {
        Row: {
          bio: string | null;
          certificate_number: string | null;
          certified_at: string | null;
          constituency: string | null;
          county: string;
          created_at: string;
          date_of_birth: string | null;
          election_cycle_id: number | null;
          email: string | null;
          full_name: string;
          gender: string | null;
          id: string;
          iebc_voter_number: string | null;
          national_id: string;
          party: string | null;
          phone: string;
          photo_path: string | null;
          position_id: string | null;
          position_title: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          slogan: string | null;
          status: Database["public"]["Enums"]["candidate_status"];
          tier: Database["public"]["Enums"]["candidate_tier"];
          updated_at: string;
          user_id: string | null;
          ward: string | null;
        };
        Insert: {
          bio?: string | null;
          certificate_number?: string | null;
          certified_at?: string | null;
          constituency?: string | null;
          county: string;
          created_at?: string;
          date_of_birth?: string | null;
          election_cycle_id?: number | null;
          email?: string | null;
          full_name: string;
          gender?: string | null;
          id?: string;
          iebc_voter_number?: string | null;
          national_id: string;
          party?: string | null;
          phone: string;
          photo_path?: string | null;
          position_id?: string | null;
          position_title: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          slogan?: string | null;
          status?: Database["public"]["Enums"]["candidate_status"];
          tier: Database["public"]["Enums"]["candidate_tier"];
          updated_at?: string;
          user_id?: string | null;
          ward?: string | null;
        };
        Update: {
          bio?: string | null;
          certificate_number?: string | null;
          certified_at?: string | null;
          constituency?: string | null;
          county?: string;
          created_at?: string;
          date_of_birth?: string | null;
          election_cycle_id?: number | null;
          email?: string | null;
          full_name?: string;
          gender?: string | null;
          id?: string;
          iebc_voter_number?: string | null;
          national_id?: string;
          party?: string | null;
          phone?: string;
          photo_path?: string | null;
          position_id?: string | null;
          position_title?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          slogan?: string | null;
          status?: Database["public"]["Enums"]["candidate_status"];
          tier?: Database["public"]["Enums"]["candidate_tier"];
          updated_at?: string;
          user_id?: string | null;
          ward?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "candidates_election_cycle_id_fkey";
            columns: ["election_cycle_id"];
            isOneToOne: false;
            referencedRelation: "election_cycles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "candidates_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          },
        ];
      };
      election_cycles: {
        Row: {
          created_at: string;
          id: number;
          name: string;
          phase: Database["public"]["Enums"]["election_phase"];
          slug: string;
          updated_at: string;
          window_end: string;
          window_start: string;
        };
        Insert: {
          created_at?: string;
          id?: never;
          name: string;
          phase?: Database["public"]["Enums"]["election_phase"];
          slug: string;
          updated_at?: string;
          window_end: string;
          window_start: string;
        };
        Update: {
          created_at?: string;
          id?: never;
          name?: string;
          phase?: Database["public"]["Enums"]["election_phase"];
          slug?: string;
          updated_at?: string;
          window_end?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      ke_locations: {
        Row: {
          constituency: string;
          constituency_code: string | null;
          county: string;
          county_code: string | null;
          created_at: string;
          id: number;
          ward: string;
          ward_code: string | null;
        };
        Insert: {
          constituency: string;
          constituency_code?: string | null;
          county: string;
          county_code?: string | null;
          created_at?: string;
          id?: never;
          ward: string;
          ward_code?: string | null;
        };
        Update: {
          constituency?: string;
          constituency_code?: string | null;
          county?: string;
          county_code?: string | null;
          created_at?: string;
          id?: never;
          ward?: string;
          ward_code?: string | null;
        };
        Relationships: [];
      };
      poll_windows: {
        Row: {
          closes_at: string;
          counties: string[];
          created_at: string;
          cycle_id: number;
          id: number;
          opens_at: string;
          poll_date: string;
          region: string;
          updated_at: string;
        };
        Insert: {
          closes_at: string;
          counties?: string[];
          created_at?: string;
          cycle_id: number;
          id?: never;
          opens_at: string;
          poll_date: string;
          region: string;
          updated_at?: string;
        };
        Update: {
          closes_at?: string;
          counties?: string[];
          created_at?: string;
          cycle_id?: number;
          id?: never;
          opens_at?: string;
          poll_date?: string;
          region?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "poll_windows_cycle_id_fkey";
            columns: ["cycle_id"];
            isOneToOne: false;
            referencedRelation: "election_cycles";
            referencedColumns: ["id"];
          },
        ];
      };
      positions: {
        Row: {
          applications_open: boolean;
          constituency: string | null;
          county: string | null;
          created_at: string;
          description: string;
          election_cycle_id: number;
          id: string;
          scope: string;
          tier: Database["public"]["Enums"]["position_tier"];
          title: string;
          updated_at: string;
          ward: string | null;
        };
        Insert: {
          applications_open?: boolean;
          constituency?: string | null;
          county?: string | null;
          created_at?: string;
          description: string;
          election_cycle_id: number;
          id: string;
          scope: string;
          tier: Database["public"]["Enums"]["position_tier"];
          title: string;
          updated_at?: string;
          ward?: string | null;
        };
        Update: {
          applications_open?: boolean;
          constituency?: string | null;
          county?: string | null;
          created_at?: string;
          description?: string;
          election_cycle_id?: number;
          id?: string;
          scope?: string;
          tier?: Database["public"]["Enums"]["position_tier"];
          title?: string;
          updated_at?: string;
          ward?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "positions_election_cycle_id_fkey";
            columns: ["election_cycle_id"];
            isOneToOne: false;
            referencedRelation: "election_cycles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_pledges: {
        Row: {
          amount_kes: number | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          kind: Database["public"]["Enums"]["support_kind"];
          message: string | null;
          phone: string | null;
          status: Database["public"]["Enums"]["pledge_status"];
          updated_at: string;
        };
        Insert: {
          amount_kes?: number | null;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          kind: Database["public"]["Enums"]["support_kind"];
          message?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["pledge_status"];
          updated_at?: string;
        };
        Update: {
          amount_kes?: number | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["support_kind"];
          message?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["pledge_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      vote_receipts: {
        Row: {
          candidate_id: string;
          cast_at: string;
          created_at: string;
          position_id: string;
          receipt_code: string;
          voter_id: string;
        };
        Insert: {
          candidate_id: string;
          cast_at: string;
          created_at?: string;
          position_id: string;
          receipt_code: string;
          voter_id: string;
        };
        Update: {
          candidate_id?: string;
          cast_at?: string;
          created_at?: string;
          position_id?: string;
          receipt_code?: string;
          voter_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vote_receipts_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vote_receipts_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vote_receipts_voter_id_fkey";
            columns: ["voter_id"];
            isOneToOne: false;
            referencedRelation: "voters";
            referencedColumns: ["id"];
          },
        ];
      };
      voters: {
        Row: {
          constituency: string;
          county: string;
          created_at: string;
          date_of_birth: string | null;
          full_name: string;
          gender: string | null;
          id: string;
          national_id_hash: string;
          national_id_last4: string;
          phone: string;
          phone_verified: boolean;
          registered_at: string;
          updated_at: string;
          user_id: string;
          ward: string;
        };
        Insert: {
          constituency: string;
          county: string;
          created_at?: string;
          date_of_birth?: string | null;
          full_name: string;
          gender?: string | null;
          id?: string;
          national_id_hash: string;
          national_id_last4: string;
          phone: string;
          phone_verified?: boolean;
          registered_at?: string;
          updated_at?: string;
          user_id: string;
          ward: string;
        };
        Update: {
          constituency?: string;
          county?: string;
          created_at?: string;
          date_of_birth?: string | null;
          full_name?: string;
          gender?: string | null;
          id?: string;
          national_id_hash?: string;
          national_id_last4?: string;
          phone?: string;
          phone_verified?: boolean;
          registered_at?: string;
          updated_at?: string;
          user_id?: string;
          ward?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          ballot_hash: string;
          candidate_id: string;
          cast_at: string;
          cycle_id: number;
          id: string;
          position_id: string;
          receipt_code: string;
          status: Database["public"]["Enums"]["vote_status"];
          voter_id: string;
        };
        Insert: {
          ballot_hash: string;
          candidate_id: string;
          cast_at?: string;
          cycle_id: number;
          id?: string;
          position_id: string;
          receipt_code: string;
          status?: Database["public"]["Enums"]["vote_status"];
          voter_id: string;
        };
        Update: {
          ballot_hash?: string;
          candidate_id?: string;
          cast_at?: string;
          cycle_id?: number;
          id?: string;
          position_id?: string;
          receipt_code?: string;
          status?: Database["public"]["Enums"]["vote_status"];
          voter_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_cycle_id_fkey";
            columns: ["cycle_id"];
            isOneToOne: false;
            referencedRelation: "election_cycles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_voter_id_fkey";
            columns: ["voter_id"];
            isOneToOne: false;
            referencedRelation: "voters";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      tally_by_position_live: {
        Row: {
          candidate_id: string | null;
          position_id: string | null;
          votes: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "votes_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      admin_approve_candidate: {
        Args: { p_candidate_id: string };
        Returns: Json;
      };
      admin_create_cycle: {
        Args: {
          p_name: string;
          p_phase?: Database["public"]["Enums"]["election_phase"];
          p_slug: string;
          p_window_end: string;
          p_window_start: string;
        };
        Returns: Json;
      };
      admin_create_poll_window: {
        Args: {
          p_closes_at: string;
          p_counties?: string[];
          p_cycle_id: number;
          p_opens_at: string;
          p_poll_date: string;
          p_region: string;
        };
        Returns: Json;
      };
      admin_create_position: {
        Args: {
          p_constituency?: string;
          p_county?: string;
          p_cycle_slug?: string;
          p_description?: string;
          p_scope: string;
          p_tier: Database["public"]["Enums"]["position_tier"];
          p_title: string;
          p_ward?: string;
        };
        Returns: Json;
      };
      admin_delete_cycle: { Args: { p_id: number }; Returns: Json };
      admin_delete_poll_window: { Args: { p_id: number }; Returns: Json };
      admin_delete_position: { Args: { p_id: string }; Returns: Json };
      admin_grant_role: {
        Args: {
          p_role: Database["public"]["Enums"]["admin_role"];
          p_user_id: string;
        };
        Returns: Json;
      };
      admin_list_users: {
        Args: never;
        Returns: {
          email: string;
          role: Database["public"]["Enums"]["admin_role"];
          user_id: string;
        }[];
      };
      admin_lookup_user_by_email: { Args: { p_email: string }; Returns: Json };
      admin_mfa_enrolled: { Args: { p_user: string }; Returns: boolean };
      admin_reject_candidate: {
        Args: { p_candidate_id: string; p_reason?: string };
        Returns: Json;
      };
      admin_revoke_role: { Args: { p_user_id: string }; Returns: Json };
      admin_set_cycle_phase: {
        Args: {
          p_cycle_slug: string;
          p_phase: Database["public"]["Enums"]["election_phase"];
        };
        Returns: Json;
      };
      admin_set_pledge_status: {
        Args: {
          p_pledge_id: string;
          p_status: Database["public"]["Enums"]["pledge_status"];
        };
        Returns: Json;
      };
      admin_set_position_applications_open: {
        Args: { p_id: string; p_open: boolean };
        Returns: Json;
      };
      admin_unseal_cycle: { Args: { p_cycle_slug: string }; Returns: Json };
      admin_update_cycle: {
        Args: {
          p_id: number;
          p_name: string;
          p_phase: Database["public"]["Enums"]["election_phase"];
          p_slug: string;
          p_window_end: string;
          p_window_start: string;
        };
        Returns: Json;
      };
      admin_update_poll_window: {
        Args: {
          p_closes_at: string;
          p_counties?: string[];
          p_id: number;
          p_opens_at: string;
          p_poll_date: string;
          p_region: string;
        };
        Returns: Json;
      };
      admin_update_position: {
        Args: {
          p_constituency?: string;
          p_county?: string;
          p_description?: string;
          p_id: string;
          p_scope: string;
          p_tier: Database["public"]["Enums"]["position_tier"];
          p_title: string;
          p_ward?: string;
        };
        Returns: Json;
      };
      analytics_age_split: {
        Args: { p_position_id: string };
        Returns: {
          age_band: string;
          pct: number;
          votes: number;
        }[];
      };
      analytics_gender_split: {
        Args: { p_position_id: string };
        Returns: {
          gender: string;
          pct: number;
          votes: number;
        }[];
      };
      cast_vote: {
        Args: { p_candidate_id: string; p_position_id: string };
        Returns: Json;
      };
      check_signup_uniqueness: {
        Args: { p_name: string; p_national_id?: string; p_phone?: string };
        Returns: Json;
      };
      count_approved_candidates: { Args: never; Returns: number };
      count_positions: { Args: never; Returns: number };
      count_registered_voters: { Args: never; Returns: number };
      gen_receipt_code: { Args: never; Returns: string };
      is_admin: { Args: { p_user_id?: string }; Returns: boolean };
      normalize_phone_ke: { Args: { p_phone: string }; Returns: string };
      recent_audit: {
        Args: { p_limit?: number };
        Returns: {
          action: string;
          actor_email: string;
          actor_user_id: string;
          after: Json;
          before: Json;
          created_at: string;
          id: number;
          target_id: string;
          target_type: string;
        }[];
      };
      recount_position: { Args: { p_position_id: string }; Returns: Json };
      slugify_position_id: { Args: { p_title: string }; Returns: string };
      tally_by_position: {
        Args: { p_position_id: string };
        Returns: {
          candidate_id: string;
          votes: number;
        }[];
      };
      total_votes_cast: { Args: { p_cycle_slug?: string }; Returns: number };
      validate_position_locations: {
        Args: {
          p_constituency: string;
          p_county: string;
          p_tier: Database["public"]["Enums"]["position_tier"];
          p_ward: string;
        };
        Returns: undefined;
      };
      verify_certificate: {
        Args: { p_certificate_number: string };
        Returns: Json;
      };
      verify_receipt: { Args: { p_receipt_code: string }; Returns: Json };
      voter_turnout: {
        Args: { p_constituency?: string; p_county?: string; p_ward?: string };
        Returns: {
          registered: number;
          turnout_pct: number;
          voted: number;
        }[];
      };
      votes_by_position: {
        Args: { p_cycle_slug?: string };
        Returns: {
          position_id: string;
          votes: number;
        }[];
      };
      write_audit: {
        Args: {
          p_action: string;
          p_after?: Json;
          p_before?: Json;
          p_target_id?: string;
          p_target_type?: string;
        };
        Returns: number;
      };
    };
    Enums: {
      admin_role: "superadmin" | "reviewer" | "viewer";
      candidate_status: "pending" | "approved" | "rejected";
      candidate_tier: "county" | "constituency" | "ward" | "national";
      election_phase: "draft" | "scheduled" | "open" | "closed" | "tallied" | "cancelled";
      pledge_status: "pledged" | "fulfilled" | "cancelled";
      position_tier: "national" | "county" | "constituency" | "ward";
      support_kind: "donate" | "partner" | "other";
      vote_status: "cast" | "changed" | "voided";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      admin_role: ["superadmin", "reviewer", "viewer"],
      candidate_status: ["pending", "approved", "rejected"],
      candidate_tier: ["county", "constituency", "ward", "national"],
      election_phase: ["draft", "scheduled", "open", "closed", "tallied", "cancelled"],
      pledge_status: ["pledged", "fulfilled", "cancelled"],
      position_tier: ["national", "county", "constituency", "ward"],
      support_kind: ["donate", "partner", "other"],
      vote_status: ["cast", "changed", "voided"],
    },
  },
} as const;
