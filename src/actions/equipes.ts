"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BetType } from "@/lib/types";

const VALID_BET_TYPES: BetType[] = ["victoire", "defaite", "buteur"];

export interface Equipe {
  id: string;
  user_id: string;
  name: string;
  bet_type: string;
  created_at: string;
}

export interface EquipeWithContext extends Equipe {
  activeSeries: {
    id: string;
    target_gain: number;
    betCount: number;
    sumStakes: number;
    hasPendingBet: boolean;
  } | null;
  stats: {
    seriesCount: number;
    betsCount: number;
    totalStake: number;
    netProfit: number;
    wonCount: number;
  };
}

export async function getEquipesWithContext(): Promise<EquipeWithContext[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return [];

  const [{ data: equipes }, { data: allSeries }] = await Promise.all([
    supabase
      .from("equipes")
      .select("id, user_id, name, bet_type, created_at")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("series")
      .select("id, status, target_gain, bet_type, subject, created_at, bets(id, odds, stake, result, bet_number, potential_net, created_at)")
      .eq("user_id", user.id),
  ]);

  if (!equipes) return [];

  return equipes.map((eq) => {
    const matchingSeries = (allSeries ?? []).filter(
      (s) => s.subject === eq.name && s.bet_type === eq.bet_type
    );

    const active = matchingSeries.find((s) => s.status === "en_cours");

    let totalStake = 0;
    let totalGain = 0;
    let betsCount = 0;
    let wonCount = 0;

    for (const s of matchingSeries) {
      for (const b of s.bets) {
        totalStake += b.stake;
        betsCount++;
        if (b.result === "gagne") {
          totalGain += b.stake * b.odds;
          wonCount++;
        }
      }
    }

    return {
      ...eq,
      activeSeries: active
        ? {
            id: active.id,
            target_gain: active.target_gain,
            betCount: active.bets.length,
            sumStakes: active.bets.reduce(
              (sum: number, b: { stake: number }) => sum + b.stake,
              0
            ),
            hasPendingBet: active.bets.some(
              (b: { result: string | null }) => b.result === null
            ),
          }
        : null,
      stats: {
        seriesCount: matchingSeries.length,
        betsCount,
        totalStake: Math.round(totalStake * 100) / 100,
        netProfit: Math.round((totalGain - totalStake) * 100) / 100,
        wonCount,
      },
    };
  });
}

export async function createEquipe(name: string, betType: string) {
  if (!name || !name.trim()) {
    return { error: "Le nom est requis." };
  }
  if (!VALID_BET_TYPES.includes(betType as BetType)) {
    return { error: "Type de pari invalide." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  const { error } = await supabase.from("equipes").insert({
    user_id: user.id,
    name: name.trim(),
    bet_type: betType,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Cette equipe existe deja avec ce type de pari." };
    }
    return { error: `Erreur: ${error.message}` };
  }

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

/**
 * Place a bet for an equipe.
 * - If targetGain is provided: creates a new series first
 * - Otherwise: uses the existing active series
 * - stakeOverride allows the user to modify the calculated stake
 */
export async function placeBet(data: {
  equipeName: string;
  betType: string;
  odds: number;
  stakeOverride?: number;
  targetGain?: number;
}) {
  const { equipeName, betType, odds, stakeOverride, targetGain } = data;

  if (odds <= 1) return { error: "La cote doit etre superieure a 1." };

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  let seriesId: string;
  let T: number;
  let n: number;
  let sumPreviousStakes: number;

  if (targetGain !== undefined) {
    // Create a new series
    if (targetGain <= 0) return { error: "Le gain souhaite doit etre positif." };

    const { data: newSeries, error: seriesError } = await supabase
      .from("series")
      .insert({
        user_id: user.id,
        subject: equipeName,
        bet_type: betType,
        target_gain: targetGain,
        status: "en_cours",
      })
      .select()
      .single();

    if (seriesError) {
      return { error: `Erreur creation serie: ${seriesError.message}` };
    }

    // Auto-create equipe entry if it doesn't exist
    await supabase
      .from("equipes")
      .upsert(
        { user_id: user.id, name: equipeName, bet_type: betType },
        { onConflict: "user_id,name,bet_type", ignoreDuplicates: true }
      );

    seriesId = newSeries.id;
    T = targetGain;
    n = 1;
    sumPreviousStakes = 0;
  } else {
    // Find active series
    const { data: active, error: findError } = await supabase
      .from("series")
      .select("id, target_gain")
      .eq("user_id", user.id)
      .eq("subject", equipeName)
      .eq("bet_type", betType)
      .eq("status", "en_cours")
      .single();

    if (findError || !active) {
      return { error: "Aucune serie en cours trouvee." };
    }

    seriesId = active.id;
    T = active.target_gain;

    // Get existing bets
    const { data: existingBets } = await supabase
      .from("bets")
      .select("stake")
      .eq("series_id", seriesId)
      .order("bet_number", { ascending: true });

    n = (existingBets?.length ?? 0) + 1;
    sumPreviousStakes = (existingBets ?? []).reduce(
      (sum, b) => sum + b.stake,
      0
    );
  }

  // Calculate stake: (n * T + sumPreviousStakes) / (odds - 1)
  const calculatedStake =
    Math.round(((n * T + sumPreviousStakes) / (odds - 1)) * 100) / 100;

  const stake = stakeOverride !== undefined && stakeOverride > 0
    ? Math.round(stakeOverride * 100) / 100
    : calculatedStake;

  const potential_net =
    Math.round((stake * odds - stake - sumPreviousStakes) * 100) / 100;

  const { error: insertError } = await supabase.from("bets").insert({
    series_id: seriesId,
    bet_number: n,
    odds,
    stake,
    potential_net,
    result: null,
  });

  if (insertError) {
    return { error: `Erreur ajout pari: ${insertError.message}` };
  }

  revalidatePath("/series");
  revalidatePath(`/series/${seriesId}`);

  return { success: true, seriesId, stake: calculatedStake, potential_net };
}
