// Types partagés pour les équipes / séries (le composant EquipesList a été retiré :
// la vue équipes est rendue par components/equipes/equipes-page.tsx).

export type EquipeSeries = {
  id: string;
  seriesNumber: number;
  status: string;
  target_gain: number;
  created_at: string;
  bets: {
    id: string;
    bet_number: number;
    odds: number;
    stake: number;
    potential_net: number;
    result: string | null;
    created_at: string;
    resolution_status: string | null;
    suggested_result: string | null;
    fixture_score: string | null;
  }[];
  totalStake: number;
  netProfit: number;
  roi: number;
};
