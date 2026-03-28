"use server";

import { createClient } from "@/lib/supabase/server";
import type { DashboardStats, Bet, BetType } from "@/lib/types";

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
    throw new Error(
      `Erreur lors de la recuperation des series: ${seriesError.message}`
    );
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
      .order("created_at", { ascending: true });

    if (betsError) {
      throw new Error(
        `Erreur lors de la recuperation des paris: ${betsError.message}`
      );
    }

    allBets = betsData ?? [];
  }

  // Fetch all transactions for the user
  const { data: transactions, error: transactionsError } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (transactionsError) {
    throw new Error(
      `Erreur lors de la recuperation des transactions: ${transactionsError.message}`
    );
  }

  const allTransactions = transactions ?? [];

  // --- Transaction totals ---
  const totalDeposits = allTransactions
    .filter((t) => t.type === "depot")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = allTransactions
    .filter((t) => t.type === "retrait")
    .reduce((sum, t) => sum + t.amount, 0);

  // --- Bets by category ---
  const settledBets = allBets.filter((b) => b.result !== null);
  const wonBets = allBets.filter((b) => b.result === "gagne");
  const lostBets = allBets.filter((b) => b.result === "perdu");
  const pendingBets = allBets.filter((b) => b.result === null);

  // --- Capital en cours (net profit) ---
  const totalWon = wonBets.reduce((sum, b) => sum + b.stake * b.odds, 0);
  const totalStakedSettled = settledBets.reduce((sum, b) => sum + b.stake, 0);
  const bettingProfit =
    Math.round((totalWon - totalStakedSettled) * 100) / 100;
  const capital =
    Math.round((totalDeposits - totalWithdrawals + bettingProfit) * 100) / 100;

  // --- Total Mise (all stakes including pending) ---
  const totalStakes =
    Math.round(allBets.reduce((sum, b) => sum + b.stake, 0) * 100) / 100;

  // --- Total Gains (sum of stake * odds for won bets) ---
  const totalGains = Math.round(totalWon * 100) / 100;

  // --- ROI ---
  const roi =
    totalStakes > 0
      ? Math.round((capital / totalStakes) * 10000) / 100
      : 0;

  // --- Mise en cours (pending stakes) ---
  const miseEnCours =
    Math.round(pendingBets.reduce((sum, b) => sum + b.stake, 0) * 100) / 100;

  // --- Gains potentiels (for pending bets: stake * odds - stake) ---
  const gainsPotentiels =
    Math.round(
      pendingBets.reduce((sum, b) => sum + (b.stake * b.odds - b.stake), 0) *
        100
    ) / 100;

  // --- Series en cours ---
  const seriesEnCours = series.filter((s) => s.status === "en_cours").length;

  // --- Paris gagnes / perdus ---
  const parisGagnes = wonBets.length;
  const parisPerdu = lostBets.length;

  // --- Cote moyenne ---
  const coteMoyenne =
    allBets.length > 0
      ? Math.round(
          (allBets.reduce((sum, b) => sum + b.odds, 0) / allBets.length) * 100
        ) / 100
      : 0;

  // --- Mise moyenne ---
  const miseMoyenne =
    allBets.length > 0
      ? Math.round(
          (allBets.reduce((sum, b) => sum + b.stake, 0) / allBets.length) * 100
        ) / 100
      : 0;

  // --- Capital evolution ---
  // Merge transactions and settled bets into one timeline
  type TimelineEntry =
    | { kind: "transaction"; created_at: string; type: string; amount: number }
    | { kind: "bet"; created_at: string; result: string; stake: number; odds: number };

  const timeline: TimelineEntry[] = [
    ...allTransactions.map((t) => ({
      kind: "transaction" as const,
      created_at: t.created_at,
      type: t.type,
      amount: t.amount,
    })),
    ...settledBets.map((b) => ({
      kind: "bet" as const,
      created_at: b.created_at,
      result: b.result as string,
      stake: b.stake,
      odds: b.odds,
    })),
  ].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let runningCapital = 0;
  const capitalEvolution: { date: string; capital: number }[] = [];

  for (const entry of timeline) {
    if (entry.kind === "transaction") {
      if (entry.type === "depot") {
        runningCapital += entry.amount;
      } else if (entry.type === "retrait") {
        runningCapital -= entry.amount;
      }
    } else {
      if (entry.result === "gagne") {
        runningCapital += entry.stake * entry.odds - entry.stake;
      } else {
        runningCapital -= entry.stake;
      }
    }
    capitalEvolution.push({
      date: entry.created_at,
      capital: Math.round(runningCapital * 100) / 100,
    });
  }

  // --- successByRank (kept for equipes page) ---
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

  // --- distributionByType (kept for equipes page) ---
  const typeCount = new Map<string, number>();
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
        totalSeries > 0
          ? Math.round((count / totalSeries) * 10000) / 100
          : 0,
    })
  );

  return {
    capital,
    totalStakes,
    totalGains,
    roi,
    miseEnCours,
    gainsPotentiels,
    seriesEnCours,
    parisEnCours: pendingBets.length,
    parisGagnes,
    parisPerdu,
    coteMoyenne,
    miseMoyenne,
    totalDeposits,
    totalWithdrawals,
    bettingProfit,
    capitalEvolution,
    successByRank,
    distributionByType,
  };
}
