"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SportType } from "@/lib/types";
import { getSubjectLinks, getTeamMappings } from "@/actions/teams";
import {
  round2,
  computeStake,
  computePotentialNet,
  objectiveFromStake,
  stakeFromObjective,
} from "@/lib/bet-calc";
import { summarize } from "@/lib/odds-matching";
import { BOOKMAKER_KEYS } from "@/lib/odds-api";

interface BetFormSubject {
  subject: string;
  betType: string;
  sport: string;
  lastStatus: string;
  logoUrl?: string;
  apiTeamId?: number | null;
  activeSeries?: {
    id: string;
    targetGain: number;
    betCount: number;
    sumStakes: number;
  };
}

/**
 * Données pour le form de création (modale globale) : subjects existants groupés
 * par (nom, type) avec la série en cours, + équipes API importées.
 */
export async function getBetFormData(): Promise<{
  existingSubjects: BetFormSubject[];
  teamMappings: {
    subject: string;
    apiTeamId: number | null;
    logoUrl: string | null;
    sport: string;
  }[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { existingSubjects: [], teamMappings: [] };

  const [{ data: bets }, { data: allSeries }, links, mappings] =
    await Promise.all([
      supabase
        .from("bets")
        .select("series_id, stake, series!inner(user_id)")
        .eq("series.user_id", user.id),
      supabase
        .from("series")
        .select("id, subject, bet_type, status, target_gain, sport, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      getSubjectLinks(),
      getTeamMappings(),
    ]);

  const betAgg = new Map<string, { count: number; sum: number }>();
  for (const b of bets ?? []) {
    const a = betAgg.get(b.series_id) ?? { count: 0, sum: 0 };
    a.count += 1;
    a.sum += b.stake;
    betAgg.set(b.series_id, a);
  }

  const byId = new Map(mappings.map((m) => [m.id, m]));
  const entitiesBySubject = new Map<string, (typeof mappings)[number][]>();
  for (const l of links) {
    const ent = byId.get(l.team_mapping_id);
    if (!ent) continue;
    const arr = entitiesBySubject.get(l.subject) ?? [];
    arr.push(ent);
    entitiesBySubject.set(l.subject, arr);
  }
  const logoMap: Record<string, string> = {};
  const apiIdMap: Record<string, number> = {};
  for (const [subject, entities] of entitiesBySubject) {
    const logo = entities[0]?.logo_url;
    if (logo) logoMap[subject] = logo;
    const api = entities.find((e) => e.is_club && e.api_team_id) ?? entities.find((e) => e.api_team_id);
    if (api?.api_team_id) apiIdMap[subject] = api.api_team_id;
  }

  const groups = new Map<string, BetFormSubject>();
  for (const s of allSeries ?? []) {
    const key = `${s.subject}::${s.bet_type}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        subject: s.subject,
        betType: s.bet_type,
        sport: s.sport,
        lastStatus: s.status,
        logoUrl: logoMap[s.subject],
        apiTeamId: apiIdMap[s.subject] ?? null,
      };
      groups.set(key, g);
    }
    if (s.status === "en_cours" && !g.activeSeries) {
      const agg = betAgg.get(s.id) ?? { count: 0, sum: 0 };
      g.activeSeries = {
        id: s.id,
        targetGain: s.target_gain,
        betCount: agg.count,
        sumStakes: agg.sum,
      };
    }
  }

  const teamMappings = mappings
    .filter((m) => m.is_club)
    .map((m) => ({
      subject: m.subject,
      apiTeamId: m.api_team_id,
      logoUrl: m.logo_url,
      sport: m.sport,
    }));

  return { existingSubjects: Array.from(groups.values()), teamMappings };
}

type BetMode = "resume" | "serie" | "unique";

function marketOddsColumns(prices: Record<string, number> | null | undefined) {
  const summary = prices ? summarize(prices, BOOKMAKER_KEYS) : null;
  return summary
    ? { market_odds_best: summary.best, market_odds_avg: summary.avg, market_odds_detail: summary.detail }
    : {};
}

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
  /** Match football-data rattaché (null = « Aucun match » ou pas d'équipe API). */
  fixture?: { id: number; kickoff: string } | null;
  /** Cotes marché par bookmaker (déjà filtrées sur les bookmakers cochés). */
  marketOdds?: Record<string, number> | null;
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
    fixture_id: input.fixture?.id ?? null,
    fixture_kickoff: input.fixture?.kickoff ?? null,
    resolution_status: input.fixture ? "pending" : "manual",
    ...marketOddsColumns(input.marketOdds),
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

  revalidatePath("/");
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
