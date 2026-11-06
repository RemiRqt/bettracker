"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function validateResult(
  betId: string,
  result: "gagne" | "perdu"
) {
  const supabase = await createClient();

  const { user, error: authError } = await getAuthUser();

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

  revalidatePath("/");
  revalidatePath(`/series/${bet.series_id}`);
  revalidatePath("/series");
  revalidatePath("/series/new");

  return { success: true };
}

export async function deleteBet(betId: string) {
  const supabase = await createClient();

  const { user, error: authError } = await getAuthUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select("id, series_id, bet_number")
    .eq("id", betId)
    .single();

  if (betError || !bet) {
    return { error: "Pari introuvable." };
  }

  // If this is the first bet of the series, delete the entire series
  // (the bet will be deleted automatically via ON DELETE CASCADE)
  if (bet.bet_number === 1) {
    const { error: seriesDeleteError } = await supabase
      .from("series")
      .delete()
      .eq("id", bet.series_id);

    if (seriesDeleteError) {
      return { error: `Erreur: ${seriesDeleteError.message}` };
    }
  } else {
    const { error: deleteError } = await supabase
      .from("bets")
      .delete()
      .eq("id", betId);

    if (deleteError) {
      return { error: `Erreur: ${deleteError.message}` };
    }
  }

  revalidatePath(`/series/${bet.series_id}`);
  revalidatePath("/series");
  revalidatePath("/series/new");
  revalidatePath("/");

  return { success: true };
}

export async function updateBet(
  betId: string,
  data: { odds?: number; stake?: number }
) {
  const supabase = await createClient();

  const { user, error: authError } = await getAuthUser();

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
