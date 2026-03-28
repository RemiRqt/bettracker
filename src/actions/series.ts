"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BetType } from "@/lib/types";

const VALID_BET_TYPES: BetType[] = ["victoire", "defaite", "buteur"];

export async function createSeries(formData: FormData) {
  const subject = formData.get("subject") as string | null;
  const bet_type = formData.get("bet_type") as string | null;
  const target_gain_raw = formData.get("target_gain") as string | null;

  // Validation
  if (!subject || !subject.trim()) {
    return { error: "Le sujet est requis." };
  }

  if (!bet_type || !VALID_BET_TYPES.includes(bet_type as BetType)) {
    return { error: "Type de pari invalide. Choisissez victoire, defaite ou buteur." };
  }

  if (!target_gain_raw) {
    return { error: "L'objectif de gain est requis." };
  }

  const target_gain = parseFloat(target_gain_raw);
  if (isNaN(target_gain) || target_gain <= 0) {
    return { error: "L'objectif de gain doit etre un nombre positif." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte pour creer une serie.");
  }

  const { data, error } = await supabase
    .from("series")
    .insert({
      user_id: user.id,
      subject: subject.trim(),
      bet_type,
      target_gain,
      status: "en_cours",
    })
    .select()
    .single();

  if (error) {
    return { error: `Erreur lors de la creation de la serie: ${error.message}` };
  }

  revalidatePath("/series");
  redirect(`/series/${data.id}`);
}

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

  // Delete all bets first (foreign key constraint)
  await supabase.from("bets").delete().eq("series_id", seriesId);

  const { error } = await supabase
    .from("series")
    .delete()
    .eq("id", seriesId)
    .eq("user_id", user.id);

  if (error) {
    return { error: `Erreur: ${error.message}` };
  }

  revalidatePath("/series");
  revalidatePath("/series/new");

  return { success: true };
}
