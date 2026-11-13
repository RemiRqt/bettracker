"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import type { DashboardStats } from "@/lib/types";
import { computeDashboardStats } from "@/lib/stats-calc";

function throwIfError(error: { message: string } | null, what: string) {
  if (error) {
    throw new Error(`Erreur lors de la recuperation ${what}: ${error.message}`);
  }
}

function fetchDashboardData(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  return Promise.all([
    supabase.from("series").select("id, status, target_gain, bet_type, subject, created_at").eq("user_id", userId),
    supabase.from("transactions").select("id, type, amount, created_at").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("freebets").select("id, remaining_amount").eq("user_id", userId),
    supabase.from("freebet_bets").select("id, freebet_id, odds, stake, result, created_at").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase
      .from("bets")
      .select("id, series_id, odds, stake, result, bet_number, potential_net, created_at, market_odds_best, market_odds_avg, series!inner(user_id)")
      .eq("series.user_id", userId)
      .order("created_at", { ascending: true }),
  ]);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const { user, error: authError } = await getAuthUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  // Un seul aller-retour : tout en parallèle (les paris sont filtrés par jointure sur la série).
  const [
    { data: seriesList, error: seriesError },
    { data: transactions, error: transactionsError },
    { data: freebetsData },
    { data: freebetBetsData },
    { data: betsData, error: betsError },
  ] = await fetchDashboardData(supabase, user.id);

  throwIfError(seriesError, "des series");
  throwIfError(transactionsError, "des transactions");
  throwIfError(betsError, "des paris");

  return computeDashboardStats({
    series: seriesList ?? [],
    bets: betsData ?? [],
    transactions: transactions ?? [],
    freebets: freebetsData ?? [],
    freebetBets: freebetBetsData ?? [],
  });
}
