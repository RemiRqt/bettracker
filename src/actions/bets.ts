"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addBet(seriesId: string, odds: number) {
  if (!odds || odds <= 1) {
    return { error: "La cote doit etre superieure a 1." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  // Fetch the series to get target_gain
  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select("id, target_gain, status")
    .eq("id", seriesId)
    .single();

  if (seriesError || !series) {
    return { error: "Serie introuvable." };
  }

  if (series.status !== "en_cours") {
    return { error: "Cette serie n'est plus en cours." };
  }

  const T = series.target_gain;

  // Fetch all existing bets for this series, ordered by bet_number
  const { data: existingBets, error: betsError } = await supabase
    .from("bets")
    .select("bet_number, stake")
    .eq("series_id", seriesId)
    .order("bet_number", { ascending: true });

  if (betsError) {
    return { error: `Erreur lors de la recuperation des paris: ${betsError.message}` };
  }

  const n = (existingBets?.length ?? 0) + 1;
  const sumPreviousStakes = (existingBets ?? []).reduce(
    (sum, bet) => sum + bet.stake,
    0
  );

  // Martingale formula:
  // stake = (n * T + sumPreviousStakes) / (odds - 1)
  const stake = Math.round(((n * T + sumPreviousStakes) / (odds - 1)) * 100) / 100;

  // potential_net = stake * odds - stake - sumPreviousStakes
  const potential_net =
    Math.round((stake * odds - stake - sumPreviousStakes) * 100) / 100;

  const { data: newBet, error: insertError } = await supabase
    .from("bets")
    .insert({
      series_id: seriesId,
      bet_number: n,
      odds,
      stake,
      potential_net,
      result: null,
    })
    .select()
    .single();

  if (insertError) {
    return { error: `Erreur lors de l'ajout du pari: ${insertError.message}` };
  }

  revalidatePath(`/series/${seriesId}`);

  return { stake, potential_net, bet_number: n };
}

export async function validateResult(
  betId: string,
  result: "gagne" | "perdu"
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  // Fetch the bet to find its series_id
  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select("id, series_id, result")
    .eq("id", betId)
    .single();

  if (betError || !bet) {
    return { error: "Pari introuvable." };
  }

  if (bet.result !== null) {
    return { error: "Ce pari a deja un resultat." };
  }

  // Update the bet result
  const { error: updateError } = await supabase
    .from("bets")
    .update({ result })
    .eq("id", betId);

  if (updateError) {
    return { error: `Erreur lors de la mise a jour du resultat: ${updateError.message}` };
  }

  // If the bet is won, mark the series as won
  if (result === "gagne") {
    const { error: seriesError } = await supabase
      .from("series")
      .update({ status: "gagnee" })
      .eq("id", bet.series_id);

    if (seriesError) {
      return { error: `Erreur lors de la mise a jour de la serie: ${seriesError.message}` };
    }
  }

  revalidatePath(`/series/${bet.series_id}`);
  revalidatePath("/series");
  revalidatePath("/series/new");

  return { success: true };
}

export async function deleteBet(betId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  // Fetch the bet
  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select("id, series_id, result")
    .eq("id", betId)
    .single();

  if (betError || !bet) {
    return { error: "Pari introuvable." };
  }

  const { error: deleteError } = await supabase
    .from("bets")
    .delete()
    .eq("id", betId);

  if (deleteError) {
    return { error: `Erreur: ${deleteError.message}` };
  }

  revalidatePath(`/series/${bet.series_id}`);
  revalidatePath("/series");
  revalidatePath("/series/new");

  return { success: true };
}

export async function updateBet(
  betId: string,
  data: { odds?: number; stake?: number }
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select("id, series_id, odds, stake, bet_number")
    .eq("id", betId)
    .single();

  if (betError || !bet) {
    return { error: "Pari introuvable." };
  }

  const newOdds = data.odds ?? bet.odds;
  const newStake = data.stake !== undefined ? Math.round(data.stake * 100) / 100 : bet.stake;

  if (newOdds <= 1) return { error: "La cote doit etre superieure a 1." };
  if (newStake <= 0) return { error: "La mise doit etre positive." };

  // Recalculate potential_net
  const { data: prevBets } = await supabase
    .from("bets")
    .select("stake")
    .eq("series_id", bet.series_id)
    .lt("bet_number", bet.bet_number);

  const sumPrev = (prevBets ?? []).reduce((s, b) => s + b.stake, 0);
  const potential_net = Math.round((newStake * newOdds - newStake - sumPrev) * 100) / 100;

  const { error: updateError } = await supabase
    .from("bets")
    .update({ odds: newOdds, stake: newStake, potential_net })
    .eq("id", betId);

  if (updateError) {
    return { error: `Erreur: ${updateError.message}` };
  }

  revalidatePath(`/series/${bet.series_id}`);
  revalidatePath("/series");
  revalidatePath("/series/new");

  return { success: true };
}
