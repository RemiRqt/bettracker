"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CachedFixture {
  id: number;
  date: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  league: string;
  leagueLogo: string;
}

export interface TeamMapping {
  id: string;
  user_id: string;
  subject: string;
  sport: string;
  api_team_id: number | null;
  logo_url: string | null;
  is_followed: boolean;
  next_matches_count: number;
  cached_fixtures: CachedFixture[] | null;
  fixtures_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

function revalidateTeamPaths() {
  revalidatePath("/profile");
  revalidatePath("/series");
  revalidatePath("/calendar");
}

export async function getTeamMappings(): Promise<TeamMapping[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  const { data, error } = await supabase
    .from("team_mappings")
    .select("*")
    .eq("user_id", user.id)
    .order("subject", { ascending: true });

  if (error) {
    throw new Error(`Erreur lors de la recuperation des equipes: ${error.message}`);
  }

  return (data as TeamMapping[]) || [];
}

export async function getFollowedTeams(): Promise<TeamMapping[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  const { data, error } = await supabase
    .from("team_mappings")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_followed", true)
    .order("subject", { ascending: true });

  if (error) {
    throw new Error(`Erreur lors de la recuperation des equipes suivies: ${error.message}`);
  }

  return (data as TeamMapping[]) || [];
}

export async function upsertTeamMapping(
  subject: string,
  data: {
    api_team_id?: number;
    logo_url?: string;
    sport?: string;
    is_followed?: boolean;
    next_matches_count?: number;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  if (!subject || !subject.trim()) {
    return { error: "Le sujet est requis." };
  }

  const { error } = await supabase
    .from("team_mappings")
    .upsert(
      {
        user_id: user.id,
        subject: subject.trim(),
        ...data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,subject" }
    );

  if (error) {
    return { error: `Erreur lors de la mise a jour: ${error.message}` };
  }

  revalidateTeamPaths();
  return { success: true };
}

export async function linkTeamToApi(
  subject: string,
  apiTeamId: number,
  logoUrl: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  const { error } = await supabase
    .from("team_mappings")
    .update({
      api_team_id: apiTeamId,
      logo_url: logoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("subject", subject);

  if (error) {
    return { error: `Erreur lors du lien avec l'API: ${error.message}` };
  }

  revalidateTeamPaths();
  return { success: true };
}

export async function toggleFollow(subject: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  // Check if mapping exists
  const { data: existing } = await supabase
    .from("team_mappings")
    .select("id, is_followed")
    .eq("user_id", user.id)
    .eq("subject", subject)
    .single();

  if (existing) {
    // Toggle the existing value
    const { error } = await supabase
      .from("team_mappings")
      .update({
        is_followed: !existing.is_followed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      return { error: `Erreur lors du toggle follow: ${error.message}` };
    }
  } else {
    // Create a new mapping with is_followed = true
    const { error } = await supabase
      .from("team_mappings")
      .insert({
        user_id: user.id,
        subject,
        is_followed: true,
      });

    if (error) {
      return { error: `Erreur lors de la creation du suivi: ${error.message}` };
    }
  }

  revalidateTeamPaths();
  return { success: true };
}

export async function updateMatchesCount(subject: string, count: number) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  if (count < 2 || count > 5) {
    return { error: "Le nombre de matchs doit etre entre 2 et 5." };
  }

  const { error } = await supabase
    .from("team_mappings")
    .update({
      next_matches_count: count,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("subject", subject);

  if (error) {
    return { error: `Erreur lors de la mise a jour: ${error.message}` };
  }

  revalidateTeamPaths();
  return { success: true };
}

export async function deleteTeamMapping(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  const { error } = await supabase
    .from("team_mappings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: `Erreur lors de la suppression: ${error.message}` };
  }

  revalidateTeamPaths();
  return { success: true };
}

export async function ensureTeamMappings(): Promise<TeamMapping[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  // Get all unique subjects from the user's series
  const { data: seriesData } = await supabase
    .from("series")
    .select("subject")
    .eq("user_id", user.id);

  const uniqueSubjects = [...new Set((seriesData || []).map((s) => s.subject))];

  // Get existing team mappings
  const { data: existingMappings } = await supabase
    .from("team_mappings")
    .select("*")
    .eq("user_id", user.id);

  const existingSubjects = new Set(
    (existingMappings || []).map((m: { subject: string }) => m.subject)
  );

  // Find subjects that don't have a mapping yet
  const missingSubjects = uniqueSubjects.filter(
    (subject) => !existingSubjects.has(subject)
  );

  // Create mappings for missing subjects
  if (missingSubjects.length > 0) {
    await supabase.from("team_mappings").insert(
      missingSubjects.map((subject) => ({
        user_id: user.id,
        subject,
        sport: "football",
        is_followed: false,
        next_matches_count: 2,
      }))
    );
  }

  // Return the full updated list
  const { data: allMappings } = await supabase
    .from("team_mappings")
    .select("*")
    .eq("user_id", user.id)
    .order("subject", { ascending: true });

  return (allMappings as TeamMapping[]) || [];
}

/**
 * Get team mappings relevant for the calendar:
 * - Followed teams
 * - Teams with active series (en_cours)
 */
export async function getCalendarTeams(): Promise<TeamMapping[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  // Get subjects from active series
  const { data: activeSeries } = await supabase
    .from("series")
    .select("subject")
    .eq("user_id", user.id)
    .eq("status", "en_cours");

  const activeSubjects = [
    ...new Set((activeSeries || []).map((s) => s.subject)),
  ];

  // Get all team mappings
  const { data: allMappings } = await supabase
    .from("team_mappings")
    .select("*")
    .eq("user_id", user.id);

  if (!allMappings) return [];

  // Filter: followed OR has active series, AND must have api_team_id
  const filtered = (allMappings as TeamMapping[]).filter(
    (m) =>
      m.api_team_id !== null &&
      (m.is_followed || activeSubjects.includes(m.subject))
  );

  console.log(
    `[Calendar] ${allMappings.length} mappings total, ${activeSubjects.length} active series subjects, ${filtered.length} teams eligible for calendar`
  );
  if (filtered.length === 0 && allMappings.length > 0) {
    const withApiId = (allMappings as TeamMapping[]).filter((m) => m.api_team_id !== null);
    const followed = (allMappings as TeamMapping[]).filter((m) => m.is_followed);
    console.log(
      `[Calendar] Debug: ${withApiId.length} with api_team_id, ${followed.length} followed`
    );
  }

  return filtered;
}

const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const FETCH_DAYS = 10; // Number of days to scan for upcoming fixtures
const MAX_CONSECUTIVE_EMPTY = 3; // Stop after this many empty days

interface ApiFixtureItem {
  fixture: { id: number; date: string };
  league: { name: string; logo: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
}

/**
 * Fetch upcoming fixtures using date-based queries (works on free plan).
 * The free plan doesn't support ?team={id}&next={n}, so we fetch all
 * fixtures per day and filter for our teams client-side.
 */
async function fetchFixturesByDate(
  teamIds: Set<number>,
  maxPerTeam: number
): Promise<Map<number, CachedFixture[]>> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    console.error("[Calendar] API_FOOTBALL_KEY is not set");
    return new Map();
  }

  const fixturesByTeam = new Map<number, CachedFixture[]>();
  const seenFixtureIds = new Set<number>();
  let consecutiveEmpty = 0;

  const today = new Date();

  for (let i = 0; i < FETCH_DAYS; i++) {
    // Stop if all teams have enough fixtures
    const allTeamsFull = [...teamIds].every(
      (id) => (fixturesByTeam.get(id)?.length ?? 0) >= maxPerTeam
    );
    if (allTeamsFull) break;

    // Stop after too many consecutive empty days (no more data available)
    if (consecutiveEmpty >= MAX_CONSECUTIVE_EMPTY) break;

    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);

    try {
      const res = await fetch(
        `${API_FOOTBALL_BASE}/fixtures?date=${dateStr}`,
        {
          headers: { "x-apisports-key": apiKey },
        }
      );

      if (!res.ok) {
        console.error(`[Calendar] API HTTP error for date ${dateStr}: ${res.status}`);
        consecutiveEmpty++;
        continue;
      }

      const json = await res.json();

      if (json.errors && Object.keys(json.errors).length > 0) {
        console.error(`[Calendar] API errors for date ${dateStr}:`, json.errors);
        consecutiveEmpty++;
        continue;
      }

      const items: ApiFixtureItem[] = json.response || [];

      if (items.length === 0) {
        consecutiveEmpty++;
        continue;
      }

      consecutiveEmpty = 0;
      let matchesFound = 0;

      for (const item of items) {
        const homeId = item.teams.home.id;
        const awayId = item.teams.away.id;

        // Check if either team is one we're tracking
        const matchedIds = [homeId, awayId].filter((id) => teamIds.has(id));
        if (matchedIds.length === 0) continue;

        // Skip already-seen fixtures (in case of overlap)
        if (seenFixtureIds.has(item.fixture.id)) continue;
        seenFixtureIds.add(item.fixture.id);

        const fixture: CachedFixture = {
          id: item.fixture.id,
          date: item.fixture.date,
          homeTeam: item.teams.home.name,
          homeLogo: item.teams.home.logo,
          awayTeam: item.teams.away.name,
          awayLogo: item.teams.away.logo,
          league: item.league.name,
          leagueLogo: item.league.logo,
        };

        // Add to each matched team's list (if not already full)
        for (const teamId of matchedIds) {
          const teamFixtures = fixturesByTeam.get(teamId) ?? [];
          if (teamFixtures.length < maxPerTeam) {
            teamFixtures.push(fixture);
            fixturesByTeam.set(teamId, teamFixtures);
            matchesFound++;
          }
        }
      }

      console.log(
        `[Calendar] ${dateStr}: ${items.length} fixtures, ${matchesFound} matched our teams`
      );
    } catch (error) {
      console.error(`[Calendar] Failed to fetch fixtures for ${dateStr}:`, error);
      consecutiveEmpty++;
    }
  }

  return fixturesByTeam;
}

export async function getCalendarFixtures(): Promise<
  { team: TeamMapping; fixtures: CachedFixture[] }[]
> {
  const teams = await getCalendarTeams();

  if (teams.length === 0) {
    return [];
  }

  // Check if cache is still valid (use the most recent update across all teams)
  const mostRecentUpdate = teams.reduce((latest, t) => {
    if (!t.fixtures_updated_at) return latest;
    const ts = new Date(t.fixtures_updated_at).getTime();
    return ts > latest ? ts : latest;
  }, 0);

  const cacheValid = mostRecentUpdate > 0 && Date.now() - mostRecentUpdate < CACHE_TTL_MS;

  if (cacheValid) {
    console.log("[Calendar] Using cached fixtures");
    // Return cached data
    const results: { team: TeamMapping; fixtures: CachedFixture[] }[] = [];
    const seenFixtureIds = new Set<number>();

    for (const team of teams) {
      if (team.cached_fixtures && team.cached_fixtures.length > 0) {
        const uniqueFixtures = team.cached_fixtures.filter((f) => {
          if (seenFixtureIds.has(f.id)) return false;
          seenFixtureIds.add(f.id);
          return true;
        });
        if (uniqueFixtures.length > 0) {
          results.push({ team, fixtures: uniqueFixtures });
        }
      }
    }

    return results;
  }

  // Fetch fresh data using date-based approach (free plan compatible)
  console.log(`[Calendar] Fetching fresh fixtures for ${teams.length} teams`);

  const teamIds = new Set(
    teams.map((t) => t.api_team_id).filter((id): id is number => id !== null)
  );
  const maxPerTeam = Math.max(...teams.map((t) => t.next_matches_count));
  const fixturesByTeam = await fetchFixturesByDate(teamIds, maxPerTeam);

  // Save to database and build results
  const supabase = await createClient();
  const results: { team: TeamMapping; fixtures: CachedFixture[] }[] = [];
  const seenFixtureIds = new Set<number>();
  const now = new Date().toISOString();

  for (const team of teams) {
    const teamFixtures = fixturesByTeam.get(team.api_team_id!) ?? [];

    // Update cache in DB
    await supabase
      .from("team_mappings")
      .update({
        cached_fixtures: JSON.parse(JSON.stringify(teamFixtures)),
        fixtures_updated_at: now,
      })
      .eq("id", team.id);

    // Deduplicate for display
    if (teamFixtures.length > 0) {
      const uniqueFixtures = teamFixtures.filter((f) => {
        if (seenFixtureIds.has(f.id)) return false;
        seenFixtureIds.add(f.id);
        return true;
      });
      if (uniqueFixtures.length > 0) {
        results.push({
          team: { ...team, cached_fixtures: teamFixtures, fixtures_updated_at: now },
          fixtures: uniqueFixtures,
        });
      }
    }
  }

  console.log(
    `[Calendar] Found fixtures for ${results.length}/${teams.length} teams`
  );

  return results;
}
