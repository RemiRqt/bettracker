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
