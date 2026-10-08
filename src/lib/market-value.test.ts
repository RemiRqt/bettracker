import { describe, expect, it } from "vitest";
import { computeMarketValue } from "./market-value";

const bet = (odds: number, best: number | null, avg: number | null) => ({
  odds,
  market_odds_best: best,
  market_odds_avg: avg,
});

describe("computeMarketValue", () => {
  it("moins de 3 paris avec cotes → null", () => {
    expect(computeMarketValue([bet(2, 2.1, 2), bet(1.5, 1.6, 1.5), bet(3, null, null)])).toBeNull();
  });
  it("moyenne des écarts vs moyenne marché + meilleure cote prise", () => {
    expect(computeMarketValue([bet(2.2, 2.2, 2), bet(1.5, 1.6, 1.5), bet(1.9, 2.1, 2)])).toEqual({
      count: 3,
      avgEdgePct: 1.7,
      bestTaken: 1,
    });
  });
});
