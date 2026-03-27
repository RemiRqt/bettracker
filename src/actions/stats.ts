"use server";

import { createClient } from "@/lib/supabase/server";
import type { DashboardStats, Bet, BetType, SeriesWithBets } from "@/lib/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  // Fetch all user's series
  const { data: seriesList, error: seriesError } = await supabase
    .from("series")
    .select("*")
    .eq("user_id", user.id);

  if (seriesError) {
    throw new Error(`Erreur lors de la recuperation des series: ${seriesError.message}`);
  }

  const series = seriesList ?? [];
  const seriesIds = series.map((s) => s.id);

  // Fetch all bets for these series
  let allBets: Bet[] = [];
  if (seriesIds.length > 0) {
    const { data: betsData, error: betsError } = await supabase
      .from("bets")
      .select("*")
      .in("series_id", seriesIds)
      .order("bet_number", { ascending: true });

    if (betsError) {
      throw new Error(`Erreur lors de la recuperation des paris: ${betsError.message}`);
    }

    allBets = betsData ?? [];
  }

  // Group bets by series
  const betsBySeriesId = new Map<string, Bet[]>();
  for (const bet of allBets) {
    const existing = betsBySeriesId.get(bet.series_id) ?? [];
    existing.push(bet);
    betsBySeriesId.set(bet.series_id, existing);
  }

  // --- netGain & roi ---
  // totalWon = sum of (stake * odds) for bets where result = 'gagne'
  // totalStaked (settled) = sum of stake for all bets where result is not null
  // netGain = totalWon - totalStakedSettled
  const settledBets = allBets.filter((b) => b.result !== null);
  const wonBets = allBets.filter((b) => b.result === "gagne");

  const totalWon = wonBets.reduce((sum, b) => sum + b.stake * b.odds, 0);
  const totalStakedSettled = settledBets.reduce((sum, b) => sum + b.stake, 0);
  const netGain = Math.round((totalWon - totalStakedSettled) * 100) / 100;
  const roi =
    totalStakedSettled > 0
      ? Math.round((netGain / totalStakedSettled) * 10000) / 100
      : 0;

  // --- totalStakes (including pending) ---
  const totalStakes = Math.round(
    allBets.reduce((sum, b) => sum + b.stake, 0) * 100
  ) / 100;

  // --- activeSeriesCount ---
  const activeSeriesCount = series.filter((s) => s.status === "en_cours").length;

  // --- successByRank ---
  const rankMap = new Map<number, { won: number; total: number }>();
  for (const bet of settledBets) {
    const rank = bet.bet_number;
    const entry = rankMap.get(rank) ?? { won: 0, total: 0 };
    entry.total += 1;
    if (bet.result === "gagne") {
      entry.won += 1;
    }
    rankMap.set(rank, entry);
  }

  const successByRank = Array.from(rankMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([rank, data]) => ({ rank, ...data }));

  // --- distributionByType ---
  const typeCount = new Map<BetType, number>();
  for (const s of series) {
    const bt = s.bet_type as BetType;
    typeCount.set(bt, (typeCount.get(bt) ?? 0) + 1);
  }

  const totalSeries = series.length;
  const distributionByType = Array.from(typeCount.entries()).map(
    ([type, count]) => ({
      type,
      count,
      percentage:
        totalSeries > 0 ? Math.round((count / totalSeries) * 10000) / 100 : 0,
    })
  );

  // --- activeSeries with cumulativeStake ---
  const activeSeries = series
    .filter((s) => s.status === "en_cours")
    .map((s) => {
      const bets = betsBySeriesId.get(s.id) ?? [];
      const cumulativeStake = Math.round(
        bets.reduce((sum, b) => sum + b.stake, 0) * 100
      ) / 100;
      return {
        ...s,
        bets,
        cumulativeStake,
      } as SeriesWithBets & { cumulativeStake: number };
    });

  return {
    netGain,
    roi,
    totalStakes,
    activeSeriesCount,
    successByRank,
    distributionByType,
    activeSeries,
  };
}
