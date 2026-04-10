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
  subject: string;
  odds: number;
  stake: number;
}) {
  const { subject, odds, stake } = data;

  if (!subject?.trim()) return { error: "Le sujet est requis." };
  if (odds <= 1) return { error: "La cote doit être supérieure à 1." };
  if (stake <= 0) return { error: "La mise doit être positive." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Vous devez être connecté.");

  const roundedStake = Math.round(stake * 100) / 100;

  // Get freebets with remaining balance, oldest first (FIFO)
  const { data: freebets } = await supabase
    .from("freebets")
    .select("id, remaining_amount")
    .eq("user_id", user.id)
    .gt("remaining_amount", 0)
    .order("created_at", { ascending: true });

  if (!freebets || freebets.length === 0) {
    return { error: "Aucun freebet disponible." };
  }

  const totalBalance = freebets.reduce((s, f) => s + f.remaining_amount, 0);
  if (totalBalance < roundedStake) {
    return { error: `Solde insuffisant (${Math.round(totalBalance * 100) / 100}€ disponible).` };
  }

  // Consume from oldest to newest
  let remaining = roundedStake;
  const consumptions: { id: string; oldAmount: number; deducted: number }[] = [];

  for (const fb of freebets) {
    if (remaining <= 0) break;
    const deducted = Math.min(fb.remaining_amount, remaining);
    consumptions.push({ id: fb.id, oldAmount: fb.remaining_amount, deducted });
    remaining = Math.round((remaining - deducted) * 100) / 100;
  }

  // Use the first consumed freebet as the freebet_id for the bet record
  const primaryFreebetId = consumptions[0].id;

  // Deduct from each freebet
  for (const c of consumptions) {
    const newAmount = Math.round((c.oldAmount - c.deducted) * 100) / 100;
    const { error: decError } = await supabase
      .from("freebets")
      .update({ remaining_amount: newAmount })
      .eq("id", c.id);

    if (decError) {
      // Rollback previous deductions
      for (const prev of consumptions) {
        if (prev.id === c.id) break;
        await supabase.from("freebets").update({ remaining_amount: prev.oldAmount }).eq("id", prev.id);
      }
      return { error: `Erreur: ${decError.message}` };
    }
  }

  const { error: insertError } = await supabase.from("freebet_bets").insert({
    user_id: user.id,
    freebet_id: primaryFreebetId,
    subject: subject.trim(),
    odds,
    stake: roundedStake,
    result: null,
  });

  if (insertError) {
    // Rollback all deductions
    for (const c of consumptions) {
      await supabase.from("freebets").update({ remaining_amount: c.oldAmount }).eq("id", c.id);
    }
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
