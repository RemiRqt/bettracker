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
