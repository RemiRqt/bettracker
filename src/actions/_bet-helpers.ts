import type { createClient } from "@/lib/supabase/server";
import type { SportType } from "@/lib/types";
import type { SubjectLink, TeamMapping } from "@/actions/_team-loaders";
import { objectiveFromStake } from "@/lib/bet-calc";

// Module serveur partagé (pas "use server") : helpers de src/actions/bets.ts.

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export interface BetFormSubject {
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

type BetAgg = Map<string, { count: number; sum: number }>;

export function aggregateBetsBySeries(bets: { series_id: string; stake: number }[]): BetAgg {
  const betAgg: BetAgg = new Map();
  for (const b of bets) {
    const a = betAgg.get(b.series_id) ?? { count: 0, sum: 0 };
    a.count += 1;
    a.sum += b.stake;
    betAgg.set(b.series_id, a);
  }
  return betAgg;
}

type MappingLite = Pick<TeamMapping, "id" | "logo_url" | "is_club" | "api_team_id">;

/** Logo et id API par subject, à partir des liens subject → entités. */
export function buildSubjectMaps(links: Pick<SubjectLink, "subject" | "team_mapping_id">[], mappings: MappingLite[]) {
  const byId = new Map(mappings.map((m) => [m.id, m]));
  const entitiesBySubject = new Map<string, MappingLite[]>();
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
  return { logoMap, apiIdMap };
}

interface SeriesRow {
  id: string;
  subject: string;
  bet_type: string;
  status: string;
  target_gain: number;
  sport: string;
}

/** Regroupe les séries par (nom, type), la plus récente d'abord, avec la série en cours. */
export function groupSeriesBySubject(
  allSeries: SeriesRow[],
  betAgg: BetAgg,
  maps: { logoMap: Record<string, string>; apiIdMap: Record<string, number> },
): BetFormSubject[] {
  const groups = new Map<string, BetFormSubject>();
  for (const s of allSeries) {
    const key = `${s.subject}::${s.bet_type}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        subject: s.subject,
        betType: s.bet_type,
        sport: s.sport,
        lastStatus: s.status,
        logoUrl: maps.logoMap[s.subject],
        apiTeamId: maps.apiIdMap[s.subject] ?? null,
      };
      groups.set(key, g);
    }
    if (s.status === "en_cours" && !g.activeSeries) {
      const agg = betAgg.get(s.id) ?? { count: 0, sum: 0 };
      g.activeSeries = { id: s.id, targetGain: s.target_gain, betCount: agg.count, sumStakes: agg.sum };
    }
  }
  return Array.from(groups.values());
}

export interface SeriesContext {
  seriesId: string;
  n: number;
  sumPrev: number;
  T: number;
}

/** Reprise : série en cours du subject + mises précédentes. */
export async function resumeSeries(supabase: SupabaseServer, userId: string, name: string, betType: string): Promise<SeriesContext | { error: string }> {
  const { data: active, error: findErr } = await supabase
    .from("series")
    .select("id, target_gain")
    .eq("user_id", userId)
    .eq("subject", name)
    .eq("bet_type", betType)
    .eq("status", "en_cours")
    .single();
  if (findErr || !active) return { error: "Aucune serie en cours pour cette equipe." };

  const { data: prev } = await supabase.from("bets").select("stake").eq("series_id", active.id).order("bet_number", { ascending: true });
  return {
    seriesId: active.id,
    T: active.target_gain,
    n: (prev?.length ?? 0) + 1,
    sumPrev: (prev ?? []).reduce((s, b) => s + b.stake, 0),
  };
}

interface NewSeriesInput {
  mode: "serie" | "unique";
  odds: number;
  targetGain?: number;
  stake?: number;
}

function resolveTarget(input: NewSeriesInput): number | { error: string } {
  if (input.mode === "serie") {
    if (!input.targetGain || input.targetGain <= 0) return { error: "L'objectif de gain est requis." };
    return input.targetGain;
  }
  // unique : exactement un de { targetGain, stake }
  if (input.targetGain && input.targetGain > 0) return input.targetGain;
  if (input.stake && input.stake > 0) return objectiveFromStake(input.stake, input.odds);
  return { error: "Renseigne un objectif ou une mise." };
}

/** Nouvelle série (série ou pari unique) + équipe enregistrée (idempotent). */
export async function createSeries(
  supabase: SupabaseServer,
  userId: string,
  meta: { name: string; betType: string; sport: SportType },
  input: NewSeriesInput,
): Promise<SeriesContext | { error: string }> {
  const target = resolveTarget(input);
  if (typeof target !== "number") return target;
  const { name, betType, sport } = meta;

  const { data: newSeries, error: seriesErr } = await supabase
    .from("series")
    .insert({
      user_id: userId,
      subject: name,
      bet_type: betType,
      target_gain: target,
      status: "en_cours",
      kind: input.mode === "unique" ? "unique" : "serie",
      sport,
    })
    .select("id")
    .single();
  if (seriesErr) return { error: `Erreur creation serie: ${seriesErr.message}` };

  await supabase.from("equipes").upsert({ user_id: userId, name, bet_type: betType, sport }, { onConflict: "user_id,name,bet_type", ignoreDuplicates: true });

  return { seriesId: newSeries.id, T: target, n: 1, sumPrev: 0 };
}

export interface ApiTeamInput {
  apiTeamId: number;
  crestUrl: string;
  kind?: "club" | "national";
  country?: string;
}

/** Foot : garantir le lien API si une equipe a ete choisie (idempotent, cf. addClub). */
export async function ensureApiTeamLink(supabase: SupabaseServer, userId: string, name: string, apiTeam: ApiTeamInput) {
  const { data: existing } = await supabase
    .from("team_mappings")
    .select("id")
    .eq("user_id", userId)
    .eq("api_team_id", apiTeam.apiTeamId)
    .eq("is_club", true)
    .maybeSingle();
  let mappingId = existing?.id as string | undefined;
  if (!mappingId) {
    const { data: inserted } = await supabase
      .from("team_mappings")
      .insert({
        user_id: userId,
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
    await supabase
      .from("subject_links")
      .upsert({ user_id: userId, subject: name, team_mapping_id: mappingId }, { onConflict: "user_id,subject,team_mapping_id", ignoreDuplicates: true });
  }
}
