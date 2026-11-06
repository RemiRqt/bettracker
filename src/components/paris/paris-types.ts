export interface Series {
  id: string;
  subject: string;
  bet_type: string;
  status: string;
  target_gain: number;
  user_id: string;
  kind: string;
  sport: string;
}

export interface Bet {
  id: string;
  bet_number: number;
  odds: number;
  stake: number;
  potential_net: number;
  result: string | null;
  created_at: string;
  series_id: string;
  series: Series;
  resolution_status: string | null;
  suggested_result: string | null;
  fixture_score: string | null;
}

export type FilterValue = "en_cours" | "gagne" | "perdu";
export type FilterKey = FilterValue | null;
export type SortKey = "date" | "gains" | "mise" | "cote";
