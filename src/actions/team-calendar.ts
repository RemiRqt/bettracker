"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { fetchTeamFixtures } from "@/lib/football-data";
import type { CachedFixture } from "@/lib/football-data";
import { loadCalendarTeams, type TeamMapping } from "@/actions/_team-loaders";

/**
 * Get team mappings relevant for the calendar:
 * - Followed clubs with api_team_id
 */
export async function getCalendarTeams(): Promise<TeamMapping[]> {
  const { user, error: authError } = await getAuthUser();

  if (authError || !user) {
    return [];
  }

  return loadCalendarTeams(user.id);
}

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function getCalendarFixtures(): Promise<TeamFixtures[]> {
  const teams = await getCalendarTeams();

  if (teams.length === 0) {
    return [];
  }

  if (isCacheValid(teams)) {
    return fromCache(teams);
  }

  return fetchAndCacheFixtures(teams);
}

type TeamFixtures = { team: TeamMapping; fixtures: CachedFixture[] };

/** Cache valide si la mise à jour la plus récente (toutes équipes) a moins de 12 h. */
function isCacheValid(teams: TeamMapping[]): boolean {
  const mostRecentUpdate = teams.reduce((latest, t) => {
    if (!t.fixtures_updated_at) return latest;
    const ts = new Date(t.fixtures_updated_at).getTime();
    return ts > latest ? ts : latest;
  }, 0);
  return mostRecentUpdate > 0 && Date.now() - mostRecentUpdate < CACHE_TTL_MS;
}

/** Retire les matchs déjà vus (un match entre deux équipes suivies n'apparaît qu'une fois). */
function dedupe(fixtures: CachedFixture[], seenFixtureIds: Set<number>): CachedFixture[] {
  return fixtures.filter((f) => {
    if (seenFixtureIds.has(f.id)) return false;
    seenFixtureIds.add(f.id);
    return true;
  });
}

function fromCache(teams: TeamMapping[]): TeamFixtures[] {
  const results: TeamFixtures[] = [];
  const seenFixtureIds = new Set<number>();
  for (const team of teams) {
    if (team.cached_fixtures && team.cached_fixtures.length > 0) {
      const uniqueFixtures = dedupe(team.cached_fixtures, seenFixtureIds);
      if (uniqueFixtures.length > 0) {
        results.push({ team, fixtures: uniqueFixtures });
      }
    }
  }
  return results;
}

/** Fetch fresh data: one call per team (much more efficient than date scanning) */
async function fetchAndCacheFixtures(teams: TeamMapping[]): Promise<TeamFixtures[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Fetch all teams in parallel (loadCalendarTeams ne renvoie que des équipes avec id API)
  const fetchResults = await Promise.all(
    teams
      .filter((team): team is TeamMapping & { api_team_id: number } => team.api_team_id !== null)
      .map(async (team) => ({
        team,
        fixtures: await fetchTeamFixtures(team.api_team_id, team.next_matches_count),
      })),
  );

  // Mise à jour du cache en base, en parallèle
  await Promise.all(
    fetchResults.map(({ team, fixtures }) =>
      supabase
        .from("team_mappings")
        .update({
          cached_fixtures: JSON.parse(JSON.stringify(fixtures)),
          fixtures_updated_at: now,
        })
        .eq("id", team.id),
    ),
  );

  const results: TeamFixtures[] = [];
  const seenFixtureIds = new Set<number>();
  for (const { team, fixtures } of fetchResults) {
    // Deduplicate for display
    if (fixtures.length > 0) {
      const uniqueFixtures = dedupe(fixtures, seenFixtureIds);
      if (uniqueFixtures.length > 0) {
        results.push({
          team: { ...team, cached_fixtures: fixtures, fixtures_updated_at: now },
          fixtures: uniqueFixtures,
        });
      }
    }
  }
  return results;
}

/**
 * Force refresh fixtures by clearing the cache, then revalidate calendar page.
 */
export async function refreshCalendarFixtures() {
  const supabase = await createClient();

  const { user, error: authError } = await getAuthUser();

  if (authError || !user) {
    return { error: "Non connecte." };
  }

  // Clear cache to force re-fetch
  await supabase.from("team_mappings").update({ cached_fixtures: null, fixtures_updated_at: null }).eq("user_id", user.id).not("api_team_id", "is", null);

  revalidatePath("/calendar");

  return { success: true };
}
