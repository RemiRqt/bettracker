import { Database } from "./database";

// Row types (read from DB)
export type Series = Database["public"]["Tables"]["series"]["Row"];
export type Bet = Database["public"]["Tables"]["bets"]["Row"];

// Insert types (write to DB)
export type SeriesInsert = Database["public"]["Tables"]["series"]["Insert"];
export type BetInsert = Database["public"]["Tables"]["bets"]["Insert"];

// Composite types
export type SeriesWithBets = Series & { bets: Bet[] };

// Dashboard "action items": active series needing attention on the dashboard.
// If a série has a pending bet, show it directly; otherwise show the série
// (next match + Parier button).
export interface ActionItem {
  seriesId: string;
  subject: string;
  betType: BetType;
  sport: SportType;
  targetGain: number;
  logoUrl: string | null;
  nextMatchDate: string | null;
  pendingBet: {
    id: string;
    betNumber: number;
    odds: number;
    stake: number;
    suggestion: BetSuggestion;
  } | null;
}

// Suggestion auto du résultat (colonnes bets, migration 00020)
export interface BetSuggestion {
  resolution_status: string | null;
  suggested_result: string | null;
  fixture_score: string | null;
}

// Domain enums
export type BetType = "victoire" | "defaite" | "buteur" | "autre";
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
  capitalEvolution: {
    date: string;
    capital: number;
    deposits: number;
    valeur: number;
    encaisse: number;
  }[];
  monthlyPnl: {
    month: string; // "YYYY-MM"
    profit: number;
    stake: number;
    roi: number; // percent
    count: number;
  }[];
}
