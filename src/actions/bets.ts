"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SportType } from "@/lib/types";
import { getTeamMappings } from "@/actions/teams";
import { getSubjectLinks } from "@/actions/subject-links";
import { round2, computeStake, computePotentialNet, stakeFromObjective } from "@/lib/bet-calc";
import { summarize } from "@/lib/odds-matching";
import { BOOKMAKER_KEYS } from "@/lib/odds-api";
import {
  aggregateBetsBySeries,
  buildSubjectMaps,
  createSeries,
  ensureApiTeamLink,
  groupSeriesBySubject,
  resumeSeries,
  type ApiTeamInput,
  type BetFormSubject,
  type SeriesContext,
} from "@/actions/_bet-helpers";

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
  const { user } = await getAuthUser();
  if (!user) return { existingSubjects: [], teamMappings: [] };

  const [{ data: bets }, { data: allSeries }, links, mappings] = await Promise.all([
    supabase.from("bets").select("series_id, stake, series!inner(user_id)").eq("series.user_id", user.id),
    supabase
      .from("series")
      .select("id, subject, bet_type, status, target_gain, sport, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getSubjectLinks(),
    getTeamMappings(),
  ]);

  const betAgg = aggregateBetsBySeries(bets ?? []);
  const maps = buildSubjectMaps(links, mappings);
  const existingSubjects = groupSeriesBySubject(allSeries ?? [], betAgg, maps);

  const teamMappings = mappings
    .filter((m) => m.is_club)
    .map((m) => ({
      subject: m.subject,
      apiTeamId: m.api_team_id,
      logoUrl: m.logo_url,
      sport: m.sport,
    }));

  return { existingSubjects, teamMappings };
}

type BetMode = "resume" | "serie" | "unique";

function marketOddsColumns(prices: Record<string, number> | null | undefined) {
  const summary = prices ? summarize(prices, BOOKMAKER_KEYS) : null;
  return summary ? { market_odds_best: summary.best, market_odds_avg: summary.avg, market_odds_detail: summary.detail } : {};
}

interface CreateBetInput {
  subject: string;
  betType: string;
  sport: SportType;
  mode: BetMode;
  odds: number;
  targetGain?: number;
  stake?: number;
  apiTeam?: ApiTeamInput;
  /** Match football-data rattaché (null = « Aucun match » ou pas d'équipe API). */
  fixture?: { id: number; kickoff: string } | null;
  /** Cotes marché par bookmaker (déjà filtrées sur les bookmakers cochés). */
  marketOdds?: Record<string, number> | null;
}

function resolveStake(input: CreateBetInput, ctx: SeriesContext): number {
  const override = input.stake && input.stake > 0 ? round2(input.stake) : null;
  return input.mode === "unique" ? (override ?? stakeFromObjective(ctx.T, input.odds)) : (override ?? computeStake(ctx.n, ctx.T, ctx.sumPrev, input.odds));
}

export async function createBetEntry(input: CreateBetInput) {
  const { subject, betType, sport, mode, odds, apiTeam } = input;

  if (!subject?.trim()) return { error: "Le nom est requis." };
  if (!betType?.trim()) return { error: "Le type de pari est requis." };
  if (!odds || odds <= 1) return { error: "La cote doit etre superieure a 1." };

  const supabase = await createClient();
  const { user, error: authError } = await getAuthUser();
  if (authError || !user) throw new Error("Vous devez etre connecte.");

  const name = subject.trim();
  const ctx =
    mode === "resume"
      ? await resumeSeries(supabase, user.id, name, betType)
      : await createSeries(supabase, user.id, { name, betType, sport }, { ...input, mode });
  if ("error" in ctx) return { error: ctx.error };
  const { seriesId, n, sumPrev } = ctx;

  const stake = resolveStake(input, ctx);
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
  if (insertErr) return { error: `Erreur ajout pari: ${insertErr.message}` };

  // Foot : garantir le lien API si une equipe a ete choisie (idempotent, cf. addClub)
  if (sport === "football" && apiTeam) {
    await ensureApiTeamLink(supabase, user.id, name, apiTeam);
  }

  revalidatePath("/series");
  revalidatePath(`/series/${seriesId}`);
  revalidatePath("/");
  return { success: true, seriesId, stake, potential_net, bet_number: n };
}
