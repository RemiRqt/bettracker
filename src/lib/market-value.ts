/** Stat « valeur vs marché » : ta cote comparée aux cotes du marché à la création. */

export interface MarketValue {
  count: number;
  /** Moyenne de (ta cote / moyenne marché − 1), en %. */
  avgEdgePct: number;
  /** Nombre de paris où ta cote ≥ meilleure cote marché. */
  bestTaken: number;
}

const MIN_BETS = 3;

export function computeMarketValue(
  bets: { odds: number; market_odds_best: number | null; market_odds_avg: number | null }[],
): MarketValue | null {
  const priced = bets.filter((b) => b.market_odds_avg && b.market_odds_avg > 1 && b.market_odds_best);
  if (priced.length < MIN_BETS) return null;
  const edge = priced.reduce((s, b) => s + (b.odds / b.market_odds_avg! - 1), 0) / priced.length;
  return {
    count: priced.length,
    avgEdgePct: Math.round(edge * 1000) / 10,
    bestTaken: priced.filter((b) => b.odds >= b.market_odds_best! - 0.005).length,
  };
}
