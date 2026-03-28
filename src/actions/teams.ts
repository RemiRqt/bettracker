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
  return (allMappings as TeamMapping[]).filter(
    (m) =>
      m.api_team_id !== null &&
      (m.is_followed || activeSubjects.includes(m.subject))
  );
}

const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function refreshFixturesIfNeeded(
  teamMapping: TeamMapping
): Promise<CachedFixture[] | null> {
  if (!teamMapping.api_team_id) {
    return null;
  }

  // Check if cache is still valid
  if (teamMapping.cached_fixtures && teamMapping.fixtures_updated_at) {
    const updatedAt = new Date(teamMapping.fixtures_updated_at).getTime();
    const now = Date.now();
    if (now - updatedAt < CACHE_TTL_MS) {
      return teamMapping.cached_fixtures;
    }
  }

  // Fetch from API-Football
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    console.error("API_FOOTBALL_KEY is not set");
    // Return cached data if available, even if stale
    return teamMapping.cached_fixtures || null;
  }

  try {
    const res = await fetch(
      `${API_FOOTBALL_BASE}/fixtures?team=${teamMapping.api_team_id}&next=${teamMapping.next_matches_count}`,
      {
        headers: {
          "x-apisports-key": apiKey,
        },
      }
    );

    if (!res.ok) {
      console.error(
        `API-Football error for team ${teamMapping.api_team_id}: ${res.status}`
      );
      return teamMapping.cached_fixtures || null;
    }

    const json = await res.json();
    const response = json.response || [];

    const fixtures: CachedFixture[] = response.map(
      (item: {
        fixture: { id: number; date: string };
        league: { name: string; logo: string };
        teams: {
          home: { name: string; logo: string };
          away: { name: string; logo: string };
        };
      }) => ({
        id: item.fixture.id,
        date: item.fixture.date,
        homeTeam: item.teams.home.name,
        homeLogo: item.teams.home.logo,
        awayTeam: item.teams.away.name,
        awayLogo: item.teams.away.logo,
        league: item.league.name,
        leagueLogo: item.league.logo,
      })
    );

    // Save to database
    const supabase = await createClient();
    await supabase
      .from("team_mappings")
      .update({
        cached_fixtures: JSON.parse(JSON.stringify(fixtures)),
        fixtures_updated_at: new Date().toISOString(),
      })
      .eq("id", teamMapping.id);

    return fixtures;
  } catch (error) {
    console.error(
      `Failed to fetch fixtures for team ${teamMapping.api_team_id}:`,
      error
    );
    return teamMapping.cached_fixtures || null;
  }
}

export async function getCalendarFixtures(): Promise<
  { team: TeamMapping; fixtures: CachedFixture[] }[]
> {
  const teams = await getCalendarTeams();

  if (teams.length === 0) {
    return [];
  }

  const results: { team: TeamMapping; fixtures: CachedFixture[] }[] = [];
  const seenFixtureIds = new Set<number>();

  // Fetch fixtures for each team (sequentially to be gentle on API limits)
  for (const team of teams) {
    const fixtures = await refreshFixturesIfNeeded(team);
    if (fixtures && fixtures.length > 0) {
      // Deduplicate fixtures across teams
      const uniqueFixtures = fixtures.filter((f) => {
        if (seenFixtureIds.has(f.id)) {
          return false;
        }
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
