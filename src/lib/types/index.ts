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
export type SportType = "football" | "tennis" | "rugby" | "basket";

// Freebet types
export type Freebet = Database["public"]["Tables"]["freebets"]["Row"];
export type FreebetBet = Database["public"]["Tables"]["freebet_bets"]["Row"];

// Dashboard
export interface DashboardStats {
  capital: number;
  capitalDisponible: number;
  totalStakes: number;
  totalGains: number;
  roi: number;
  miseEnCours: number;
  gainsPotentiels: number;
  seriesEnCours: number;
  parisEnCours: number;
  parisGagnes: number;
  parisPerdu: number;
  coteMoyenne: number;
  miseMoyenne: number;
  totalDeposits: number;
  totalWithdrawals: number;
  bettingProfit: number;
  freebetBalance: number;
  freebetProfit: number;
  objectifDeGain: number;
  capitalEvolution: { date: string; capital: number; invested: number }[];
  successByRank: { rank: number; won: number; total: number }[];
  distributionByType: { type: string; count: number; percentage: number }[];
}
