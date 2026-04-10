export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      series: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          bet_type: string;
          target_gain: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          bet_type: string;
          target_gain: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          bet_type?: string;
          target_gain?: number;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bets: {
        Row: {
          id: string;
          series_id: string;
          bet_number: number;
          odds: number;
          stake: number;
          potential_net: number;
          result: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          bet_number: number;
          odds: number;
          stake: number;
          potential_net: number;
          result?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          series_id?: string;
          bet_number?: number;
          odds?: number;
          stake?: number;
          potential_net?: number;
          result?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bets_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "series";
            referencedColumns: ["id"];
          }
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount?: number;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      logo_cache: {
        Row: {
          key: string;
          data_uri: string;
          created_at: string;
        };
        Insert: {
          key: string;
          data_uri: string;
          created_at?: string;
        };
        Update: {
          key?: string;
          data_uri?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      equipes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          bet_type: string;
          sport: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          bet_type: string;
          sport?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          bet_type?: string;
          sport?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      freebets: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          initial_amount: number;
          remaining_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: string;
          initial_amount: number;
          remaining_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: string;
          initial_amount?: number;
          remaining_amount?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      freebet_bets: {
        Row: {
          id: string;
          user_id: string;
          freebet_id: string;
          subject: string;
          odds: number;
          stake: number;
          result: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          freebet_id: string;
          subject: string;
          odds: number;
          stake: number;
          result?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          freebet_id?: string;
          subject?: string;
          odds?: number;
          stake?: number;
          result?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "freebet_bets_freebet_id_fkey";
            columns: ["freebet_id"];
            isOneToOne: false;
            referencedRelation: "freebets";
            referencedColumns: ["id"];
          }
        ];
      };
      team_mappings: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          api_team_id: number | null;
          logo_url: string | null;
          sport: string;
          is_club: boolean;
          is_followed: boolean;
          next_matches_count: number;
          cached_fixtures: Json | null;
          fixtures_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          api_team_id?: number | null;
          logo_url?: string | null;
          sport?: string;
          is_club?: boolean;
          is_followed?: boolean;
          next_matches_count?: number;
          cached_fixtures?: Json | null;
          fixtures_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          api_team_id?: number | null;
          logo_url?: string | null;
          sport?: string;
          is_club?: boolean;
          is_followed?: boolean;
          next_matches_count?: number;
          cached_fixtures?: Json | null;
          fixtures_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          notifications_enabled: boolean;
          notification_lead_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          notifications_enabled?: boolean;
          notification_lead_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          notifications_enabled?: boolean;
          notification_lead_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sent_notifications: {
        Row: {
          id: string;
          user_id: string;
          fixture_id: number;
          sent_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fixture_id: number;
          sent_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          fixture_id?: number;
          sent_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
