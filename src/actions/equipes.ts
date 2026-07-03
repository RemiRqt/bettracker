"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateEquipeSport(id: string, sport: string) {
  const validSports = ["football", "tennis", "rugby", "basket"];
  if (!validSports.includes(sport)) {
    return { error: "Sport invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Vous devez etre connecte.");

  const { error } = await supabase
    .from("equipes")
    .update({ sport })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: `Erreur: ${error.message}` };

  revalidatePath("/series");
  return { success: true };
}

export async function deleteEquipe(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  const { error } = await supabase
    .from("equipes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: `Erreur: ${error.message}` };
  }

  revalidatePath("/series");
  return { success: true };
}
