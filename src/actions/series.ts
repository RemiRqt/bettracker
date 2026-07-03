"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
export async function abandonSeries(seriesId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  // Update the series status to abandoned (RLS ensures ownership)
  const { error: seriesError } = await supabase
    .from("series")
    .update({ status: "abandonnee" })
    .eq("id", seriesId);

  if (seriesError) {
    return { error: `Erreur lors de l'abandon de la serie: ${seriesError.message}` };
  }

  // Mark any pending bets (result is null) in this series as lost
  const { error: betsError } = await supabase
    .from("bets")
    .update({ result: "perdu" })
    .eq("series_id", seriesId)
    .is("result", null);

  if (betsError) {
    return { error: `Erreur lors de la mise a jour des paris: ${betsError.message}` };
  }

  revalidatePath(`/series/${seriesId}`);
  revalidatePath("/series");

  return { success: true };
}

export async function deleteSeries(seriesId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  // Verify the series belongs to the user and is "en_cours"
  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select("id, status")
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (seriesError || !series) {
    return { error: "Serie introuvable." };
  }

  if (series.status !== "en_cours") {
    return { error: "Seules les series en cours peuvent etre supprimees." };
  }

  // A series is deletable when it is empty (no bets) or holds only the
  // first bet, still pending.
  const { data: bets, error: betsError } = await supabase
    .from("bets")
    .select("id, bet_number, result")
    .eq("series_id", seriesId);

  if (betsError) {
    return { error: `Erreur: ${betsError.message}` };
  }

  const isEmpty = !bets || bets.length === 0;
  const isSinglePending =
    !!bets &&
    bets.length === 1 &&
    bets[0].bet_number === 1 &&
    bets[0].result === null;

  if (!isEmpty && !isSinglePending) {
    return {
      error:
        "Seules les series vides ou avec uniquement le pari #1 en cours peuvent etre supprimees.",
    };
  }

  // Delete the series (cascade will delete the bet)
  const { error } = await supabase
    .from("series")
    .delete()
    .eq("id", seriesId);

  if (error) {
    return { error: `Erreur: ${error.message}` };
  }

  revalidatePath("/series");
  revalidatePath("/series/new");
  revalidatePath("/");

  return { success: true };
}

