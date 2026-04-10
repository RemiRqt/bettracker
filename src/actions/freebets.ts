"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Freebet, FreebetBet } from "@/lib/types";

export async function addFreebet(formData: FormData) {
  const source = formData.get("source") as string;
  const amount = parseFloat(formData.get("amount") as string);

  if (!source?.trim()) return { error: "La source est requise." };
  if (!amount || amount <= 0) return { error: "Le montant doit être positif." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Vous devez être connecté.");

  const { error } = await supabase.from("freebets").insert({
    user_id: user.id,
    source: source.trim(),
    initial_amount: Math.round(amount * 100) / 100,
    remaining_amount: Math.round(amount * 100) / 100,
  });

  if (error) return { error: `Erreur: ${error.message}` };

  revalidatePath("/freebets");
  revalidatePath("/");
  return { success: true };
}

export async function getFreebets(): Promise<Freebet[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data } = await supabase
    .from("freebets")
    .select("id, user_id, source, initial_amount, remaining_amount, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function deleteFreebet(id: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Vous devez être connecté.");

  const { data: pending } = await supabase
    .from("freebet_bets")
    .select("id")
    .eq("freebet_id", id)
    .is("result", null)
    .limit(1);

  if (pending && pending.length > 0) {
    return { error: "Impossible de supprimer : des paris sont en attente." };
  }

  const { error } = await supabase
    .from("freebets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: `Erreur: ${error.message}` };

  revalidatePath("/freebets");
  revalidatePath("/");
  return { success: true };
}

export async function getFreebetBets(): Promise<(FreebetBet & { freebet_source: string })[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data } = await supabase
    .from("freebet_bets")
    .select("id, user_id, freebet_id, subject, odds, stake, result, created_at, freebets(source)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((b) => ({
    ...b,
    freebet_source: (b.freebets as unknown as { source: string })?.source ?? "",
    freebets: undefined,
  })) as (FreebetBet & { freebet_source: string })[];
}

export async function placeFreebetBet(data: {
  freebetId: string;
  subject: string;
  odds: number;
  stake: number;
}) {
  const { freebetId, subject, odds, stake } = data;

  if (!subject?.trim()) return { error: "Le sujet est requis." };
  if (odds <= 1) return { error: "La cote doit être supérieure à 1." };
  if (stake <= 0) return { error: "La mise doit être positive." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Vous devez être connecté.");

  const roundedStake = Math.round(stake * 100) / 100;

  const { data: freebet } = await supabase
    .from("freebets")
    .select("remaining_amount")
    .eq("id", freebetId)
    .eq("user_id", user.id)
    .single();

  if (!freebet) return { error: "Freebet introuvable." };
  if (freebet.remaining_amount < roundedStake) {
    return { error: `Solde insuffisant (${freebet.remaining_amount}€ disponible).` };
  }

  const newRemaining = Math.round((freebet.remaining_amount - roundedStake) * 100) / 100;

  const { error: decError } = await supabase
    .from("freebets")
    .update({ remaining_amount: newRemaining })
    .eq("id", freebetId)
    .eq("user_id", user.id);

  if (decError) return { error: `Erreur: ${decError.message}` };

  const { error: insertError } = await supabase.from("freebet_bets").insert({
    user_id: user.id,
    freebet_id: freebetId,
    subject: subject.trim(),
    odds,
    stake: roundedStake,
    result: null,
  });

  if (insertError) {
    // Rollback remaining_amount
    await supabase
      .from("freebets")
      .update({ remaining_amount: freebet.remaining_amount })
      .eq("id", freebetId);
    return { error: `Erreur: ${insertError.message}` };
  }

  revalidatePath("/freebets");
  revalidatePath("/");
  return { success: true, potentialProfit: Math.round((roundedStake * odds - roundedStake) * 100) / 100 };
}

export async function validateFreebetResult(betId: string, result: "gagne" | "perdu") {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Vous devez être connecté.");

  const { data: bet } = await supabase
    .from("freebet_bets")
    .select("id, result")
    .eq("id", betId)
    .eq("user_id", user.id)
    .single();

  if (!bet) return { error: "Pari introuvable." };
  if (bet.result !== null) return { error: "Ce pari a déjà un résultat." };

  const { error } = await supabase
    .from("freebet_bets")
    .update({ result })
    .eq("id", betId);

  if (error) return { error: `Erreur: ${error.message}` };

  revalidatePath("/freebets");
  revalidatePath("/");
  return { success: true };
}

export async function deleteFreebetBet(betId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Vous devez être connecté.");

  const { data: bet } = await supabase
    .from("freebet_bets")
    .select("id, freebet_id, stake, result")
    .eq("id", betId)
    .eq("user_id", user.id)
    .single();

  if (!bet) return { error: "Pari introuvable." };

  // Restore freebet balance if bet was pending
  if (bet.result === null) {
    const { data: freebet } = await supabase
      .from("freebets")
      .select("remaining_amount")
      .eq("id", bet.freebet_id)
      .single();

    if (freebet) {
      await supabase
        .from("freebets")
        .update({
          remaining_amount: Math.round((freebet.remaining_amount + bet.stake) * 100) / 100,
        })
        .eq("id", bet.freebet_id);
    }
  }

  const { error } = await supabase
    .from("freebet_bets")
    .delete()
    .eq("id", betId);

  if (error) return { error: `Erreur: ${error.message}` };

  revalidatePath("/freebets");
  revalidatePath("/");
  return { success: true };
}
