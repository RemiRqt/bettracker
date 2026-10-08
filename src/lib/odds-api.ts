/**
 * Client The Odds API v4 (server only) + cache par championnat dans `odds_cache`.
 * 1 crédit = toutes les cotes h2h d'un championnat (région fr). Offre gratuite : 500/mois.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { OddsEvent } from "./odds-matching";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const CACHE_TTL_MS = 5 * 60_000;
const TIMEOUT_MS = 8000;

/** Code compétition football-data → sport_key The Odds API. */
export const SPORT_KEYS: Record<string, string> = {
  FL1: "soccer_france_ligue_one",
  FL2: "soccer_france_ligue_two",
  PL: "soccer_epl",
  PD: "soccer_spain_la_liga",
  SA: "soccer_italy_serie_a",
  BL1: "soccer_germany_bundesliga",
  CL: "soccer_uefa_champs_league",
  EL: "soccer_uefa_europa_league",
  WC: "soccer_fifa_world_cup",
  EC: "soccer_uefa_european_championship",
};

/** Bookmakers FR disponibles (région `fr`), dans l'ordre d'affichage. */
export const BOOKMAKERS: { key: string; label: string; note?: string }[] = [
  { key: "winamax_fr", label: "Winamax" },
  { key: "betclic_fr", label: "Betclic" },
  { key: "unibet_fr", label: "Unibet" },
  { key: "pmu_fr", label: "PMU", note: "souvent indisponible" },
  { key: "netbet_fr", label: "NetBet" },
];

export const BOOKMAKER_KEYS = BOOKMAKERS.map((b) => b.key);

export const bookmakerLabel = (key: string) => BOOKMAKERS.find((b) => b.key === key)?.label ?? key;

async function fetchLeagueOdds(sportKey: string): Promise<{ events: OddsEvent[]; remaining: number | null } | null> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    console.error("[odds-api] ODDS_API_KEY is not set");
    return null;
  }
  const url = `${ODDS_API_BASE}/sports/${sportKey}/odds?apiKey=${apiKey}&regions=fr&markets=h2h&oddsFormat=decimal`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
    if (!res.ok) {
      console.error(`[odds-api] ${res.status} on ${sportKey}:`, await res.text());
      return null;
    }
    const remaining = res.headers.get("x-requests-remaining");
    return { events: (await res.json()) as OddsEvent[], remaining: remaining ? parseInt(remaining, 10) : null };
  } catch (error) {
    console.error(`[odds-api] request failed on ${sportKey}:`, error);
    return null;
  }
}

/** Cotes h2h d'un championnat, depuis le cache (< 5 min) ou l'API. `null` si indisponible. */
export async function getLeagueOdds(service: SupabaseClient, sportKey: string): Promise<OddsEvent[] | null> {
  const { data: cached } = await service
    .from("odds_cache")
    .select("events, fetched_at")
    .eq("sport_key", sportKey)
    .maybeSingle();
  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return cached.events as OddsEvent[];
  }

  const fresh = await fetchLeagueOdds(sportKey);
  if (!fresh) return null;
  await service.from("odds_cache").upsert({
    sport_key: sportKey,
    events: fresh.events,
    fetched_at: new Date().toISOString(),
    requests_remaining: fresh.remaining,
  });
  return fresh.events;
}

/** Crédits restants lors du dernier appel API (toutes ligues confondues). */
export async function getOddsCredits(service: SupabaseClient): Promise<number | null> {
  const { data } = await service
    .from("odds_cache")
    .select("requests_remaining")
    .not("requests_remaining", "is", null)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.requests_remaining ?? null;
}
