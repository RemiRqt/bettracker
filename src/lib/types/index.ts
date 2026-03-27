import { Database } from "./database";

// Row types (read from DB)
export type Series = Database["public"]["Tables"]["series"]["Row"];
export type Bet = Database["public"]["Tables"]["bets"]["Row"];

// Insert types (write to DB)
export type SeriesInsert = Database["public"]["Tables"]["series"]["Insert"];
export type BetInsert = Database["public"]["Tables"]["bets"]["Insert"];

// Composite types
export type SeriesWithBets = Series & { bets: Bet[] };

// Domain enums
export type BetType = "victoire" | "defaite" | "buteur";
export type SeriesStatus = "en_cours" | "gagnee" | "abandonnee";
export type BetResult = "gagne" | "perdu" | null;

// Dashboard
export interface DashboardStats {
  netGain: number;
  roi: number;
  totalStakes: number;
  activeSeriesCount: number;
  successByRank: {
    rank: number;
    won: number;
    total: number;
  }[];
  distributionByType: {
    type: BetType;
    count: number;
    percentage: number;
  }[];
  activeSeries: (SeriesWithBets & {
    cumulativeStake: number;
  })[];
}
