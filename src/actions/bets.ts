"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SportType } from "@/lib/types";
import {
  round2,
  computeStake,
  computePotentialNet,
  objectiveFromStake,
  stakeFromObjective,
} from "@/lib/bet-calc";

type BetMode = "resume" | "serie" | "unique";

interface CreateBetInput {
  subject: string;
  betType: string;
  sport: SportType;
  mode: BetMode;
  odds: number;
  targetGain?: number;
  stake?: number;
  apiTeam?: {
    apiTeamId: number;
    crestUrl: string;
    kind?: "club" | "national";
    country?: string;
  };
}

export async function createBetEntry(input: CreateBetInput) {
  const { subject, betType, sport, mode, odds, apiTeam } = input;

  if (!subject?.trim()) return { error: "Le nom est requis." };
  if (!betType?.trim()) return { error: "Le type de pari est requis." };
  if (!odds || odds <= 1) return { error: "La cote doit etre superieure a 1." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Vous devez etre connecte.");

  const name = subject.trim();
  let seriesId: string;
  let n: number;
  let sumPrev: number;
  let T: number;

  if (mode === "resume") {
    const { data: active, error: findErr } = await supabase
      .from("series")
      .select("id, target_gain")
      .eq("user_id", user.id)
      .eq("subject", name)
      .eq("bet_type", betType)
      .eq("status", "en_cours")
      .single();
    if (findErr || !active)
      return { error: "Aucune serie en cours pour cette equipe." };

    seriesId = active.id;
    T = active.target_gain;
    const { data: prev } = await supabase
      .from("bets")
      .select("stake")
      .eq("series_id", seriesId)
      .order("bet_number", { ascending: true });
    n = (prev?.length ?? 0) + 1;
    sumPrev = (prev ?? []).reduce((s, b) => s + b.stake, 0);
  } else {
    let target: number;
    if (mode === "serie") {
      if (!input.targetGain || input.targetGain <= 0)
        return { error: "L'objectif de gain est requis." };
      target = input.targetGain;
    } else {
      // unique : exactement un de { targetGain, stake }
      if (input.targetGain && input.targetGain > 0) target = input.targetGain;
      else if (input.stake && input.stake > 0)
        target = objectiveFromStake(input.stake, odds);
      else return { error: "Renseigne un objectif ou une mise." };
    }

    const { data: newSeries, error: seriesErr } = await supabase
      .from("series")
      .insert({
        user_id: user.id,
        subject: name,
        bet_type: betType,
        target_gain: target,
        status: "en_cours",
        kind: mode === "unique" ? "unique" : "serie",
        sport,
      })
      .select("id")
      .single();
    if (seriesErr)
      return { error: `Erreur creation serie: ${seriesErr.message}` };

    await supabase.from("equipes").upsert(
      { user_id: user.id, name, bet_type: betType, sport },
      { onConflict: "user_id,name,bet_type", ignoreDuplicates: true }
    );

    seriesId = newSeries.id;
    T = target;
    n = 1;
    sumPrev = 0;
  }

  const override =
    input.stake && input.stake > 0 ? round2(input.stake) : null;
  const stake =
    mode === "unique"
      ? override ?? stakeFromObjective(T, odds)
      : override ?? computeStake(n, T, sumPrev, odds);
  const potential_net = computePotentialNet(stake, odds, sumPrev);

  const { error: insertErr } = await supabase.from("bets").insert({
    series_id: seriesId,
    bet_number: n,
    odds,
    stake,
    potential_net,
    result: null,
  });
  if (insertErr)
    return { error: `Erreur ajout pari: ${insertErr.message}` };

  // Foot : garantir le lien API si une equipe a ete choisie (idempotent, cf. addClub)
  if (sport === "football" && apiTeam) {
    const { data: existing } = await supabase
      .from("team_mappings")
      .select("id")
      .eq("user_id", user.id)
      .eq("api_team_id", apiTeam.apiTeamId)
      .eq("is_club", true)
      .maybeSingle();
    let mappingId = existing?.id as string | undefined;
    if (!mappingId) {
      const { data: inserted } = await supabase
        .from("team_mappings")
        .insert({
          user_id: user.id,
          subject: name,
          api_team_id: apiTeam.apiTeamId,
          logo_url: apiTeam.crestUrl,
          sport: "football",
          is_club: true,
          is_followed: false,
          kind: apiTeam.kind ?? "club",
          country: apiTeam.country ?? null,
          provider: "football-data",
        })
        .select("id")
        .single();
      mappingId = inserted?.id;
    }
    if (mappingId) {
      await supabase.from("subject_links").upsert(
        { user_id: user.id, subject: name, team_mapping_id: mappingId },
        { onConflict: "user_id,subject,team_mapping_id", ignoreDuplicates: true }
      );
    }
  }

  revalidatePath("/series");
  revalidatePath(`/series/${seriesId}`);
  revalidatePath("/");
  return { success: true, seriesId, stake, potential_net, bet_number: n };
}

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
