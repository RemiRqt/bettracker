/**
 * Rafraîchit chaque jour à 12h (Paris) les cotes h2h des championnats où une
 * équipe suivie joue dans les 7 jours. 1 crédit The Odds API par championnat.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CachedFixture } from "./football-data";
import { getLeagueOdds, sportKeyFor } from "./odds-api";

const HORIZON_MS = 7 * 86_400_000;

export interface CalendarOddsReport {
  leagues: string[];
  refreshed: number;
  failed: string[];
}

export function isNoonInParis(now = new Date()): boolean {
  const hour = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }).format(now);
  return Number(hour) === 12;
}

/** sport_keys des championnats à rafraîchir (matchs des équipes suivies sous 7 jours). */
async function leaguesToRefresh(service: SupabaseClient): Promise<string[]> {
  const { data } = await service
    .from("team_mappings")
    .select("cached_fixtures")
    .eq("is_followed", true)
    .not("cached_fixtures", "is", null);

  const now = Date.now();
  const keys = new Set<string>();
  for (const row of data ?? []) {
    for (const f of (row.cached_fixtures ?? []) as CachedFixture[]) {
      const t = new Date(f.date).getTime();
      if (t < now || t > now + HORIZON_MS) continue;
      const key = sportKeyFor(f);
      if (key) keys.add(key);
    }
  }
  return [...keys];
}

export async function runCalendarOdds(service: SupabaseClient): Promise<CalendarOddsReport> {
  const leagues = await leaguesToRefresh(service);
  const failed: string[] = [];
  for (const key of leagues) {
    const events = await getLeagueOdds(service, key);
    if (!events) failed.push(key);
  }
  return { leagues, refreshed: leagues.length - failed.length, failed };
}
