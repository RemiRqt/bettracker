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
  }[];
  totalStake: number;
  netProfit: number;
  roi: number;
};

export type Equipe = {
  subject: string;
  bet_type: string;
  sport: string;
  totalStake: number;
  netProfit: number;
  roi: number;
  seriesCount: number;
  betsCount: number;
  wonCount: number;
  abandonedCount: number;
  enCoursCount: number;
  series: EquipeSeries[];
  lastBetDate: string;
  lastSeriesStatus: string;
  totalWonAmount: number;
  totalLostStake: number;
  potentialGains: number;
};
