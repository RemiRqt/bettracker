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
  is_club: boolean;
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
        is_club: false,
        ...data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,subject,is_club" }
    );

  if (error) {
    return { error: `Erreur lors de la mise a jour: ${error.message}` };
  }

  revalidateTeamPaths();
  return { success: true };
}

/**
 * Fetch a team logo via SportAPI7 (RapidAPI) and return as base64 data URI.
 * Uses RapidAPI instead of SofaScore CDN directly because SofaScore blocks
 * requests from Vercel servers.
 */
async function fetchLogoAsDataUri(teamId: number): Promise<string | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://sportapi7.p.rapidapi.com/api/v1/team/${teamId}/image`,
      {
        headers: {
          "x-rapidapi-host": "sportapi7.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Add an API club as a separate record (is_club=true).
 * Auto-fetches the logo from SofaScore and stores as base64 data URI.
 */
export async function addClub(
  apiTeamId: number,
  name: string,
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

  // Check if club already exists
  const { data: existing } = await supabase
    .from("team_mappings")
    .select("id")
    .eq("user_id", user.id)
    .eq("api_team_id", apiTeamId)
    .eq("is_club", true)
    .maybeSingle();

  if (existing) {
    return { error: "Cette equipe est deja ajoutee." };
  }

  // Auto-fetch logo as base64
  const dataUri = await fetchLogoAsDataUri(apiTeamId);

  const { error } = await supabase
    .from("team_mappings")
    .insert({
      user_id: user.id,
      subject: name,
      api_team_id: apiTeamId,
      logo_url: dataUri ?? logoUrl,
      sport: "football",
      is_club: true,
      is_followed: false,
    });

  if (error) {
    return { error: `Erreur: ${error.message}` };
  }

  revalidateTeamPaths();
  return { success: true };
}

/**
 * Refresh logo for an existing club by re-fetching from SofaScore CDN.
 */
export async function refreshClubLogo(clubId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  const { data: club } = await supabase
    .from("team_mappings")
    .select("id, api_team_id")
    .eq("id", clubId)
    .eq("user_id", user.id)
    .single();

  if (!club?.api_team_id) {
    return { error: "Club introuvable ou sans ID API." };
  }

  const dataUri = await fetchLogoAsDataUri(club.api_team_id);
  if (!dataUri) {
    return { error: "Impossible de recuperer le logo." };
  }

  await supabase
    .from("team_mappings")
    .update({ logo_url: dataUri, updated_at: new Date().toISOString() })
    .eq("id", clubId);

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
    .eq("subject", subject)
    .eq("is_club", false);

  if (error) {
    return { error: `Erreur lors du lien avec l'API: ${error.message}` };
  }

  revalidateTeamPaths();
  return { success: true };
}

export async function unlinkTeamFromApi(subject: string) {
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
      api_team_id: null,
      logo_url: null,
      is_followed: false,
      cached_fixtures: null,
      fixtures_updated_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("subject", subject)
    .eq("is_club", false);

  if (error) {
    return { error: `Erreur: ${error.message}` };
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

  // Check if mapping exists (filter by is_club to avoid conflict with series subjects)
  const { data: existing } = await supabase
    .from("team_mappings")
    .select("id, is_followed")
    .eq("user_id", user.id)
    .eq("subject", subject)
    .eq("is_club", true)
    .maybeSingle();

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
 * - Followed clubs with api_team_id
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

  // Get all team mappings
  const { data: allMappings } = await supabase
    .from("team_mappings")
    .select("*")
    .eq("user_id", user.id);

  if (!allMappings) return [];

  // Filter: clubs that are followed, AND must have api_team_id
  const filtered = (allMappings as TeamMapping[]).filter(
    (m) =>
      m.is_club &&
      m.api_team_id !== null &&
      m.is_followed
  );

  // Debug: log all clubs status
  const clubs = (allMappings as TeamMapping[]).filter((m) => m.is_club);
  console.log(
    `[Calendar] ${allMappings.length} mappings total, ${clubs.length} clubs, ${filtered.length} eligible`
  );
  for (const c of clubs) {
    console.log(
      `[Calendar] Club: "${c.subject}" api_team_id=${c.api_team_id} is_followed=${c.is_followed} is_club=${c.is_club}`
    );
  }

  return filtered;
}

const SPORTAPI_BASE = "https://sportapi7.p.rapidapi.com";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

interface SportApiEvent {
  id: number;
  startTimestamp: number;
  homeTeam: { id: number; name: string; shortName: string };
  awayTeam: { id: number; name: string; shortName: string };
  tournament: {
    name: string;
    uniqueTournament?: { id: number; name: string };
  };
}

/**
 * Fetch a logo via SportAPI7 and return as base64 data URI.
 */
async function fetchImageAsDataUri(
  path: string,
  apiKey: string
): Promise<string> {
  try {
    const res = await fetch(`${SPORTAPI_BASE}${path}`, {
      headers: {
        "x-rapidapi-host": "sportapi7.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    });
    if (!res.ok) return "";
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    return "";
  }
}

/**
 * Fetch upcoming fixtures for a single team via SportAPI7.
 * Logos (teams + league) are fetched and stored as base64 data URIs.
 */
async function fetchTeamNextEvents(
  teamId: number,
  maxCount: number
): Promise<CachedFixture[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.error("[Calendar] RAPIDAPI_KEY is not set");
    return [];
  }

  try {
    const res = await fetch(
      `${SPORTAPI_BASE}/api/v1/team/${teamId}/events/next/0`,
      {
        headers: {
          "x-rapidapi-host": "sportapi7.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );

    if (!res.ok) {
      console.error(`[Calendar] SportAPI error for team ${teamId}: ${res.status}`);
      return [];
    }

    const json = await res.json();
    const events: SportApiEvent[] = json.events ?? [];
    const sliced = events.slice(0, maxCount);

    // Collect unique IDs to fetch logos
    const teamIds = new Set<number>();
    const tournamentIds = new Set<number>();
    for (const e of sliced) {
      teamIds.add(e.homeTeam.id);
      teamIds.add(e.awayTeam.id);
      if (e.tournament.uniqueTournament?.id) {
        tournamentIds.add(e.tournament.uniqueTournament.id);
      }
    }

    // Fetch all logos in parallel
    const logoCache = new Map<string, string>();
    const fetches: Promise<void>[] = [];

    for (const id of teamIds) {
      fetches.push(
        fetchImageAsDataUri(`/api/v1/team/${id}/image`, apiKey).then((uri) => {
          logoCache.set(`team:${id}`, uri);
        })
      );
    }
    for (const id of tournamentIds) {
      fetches.push(
        fetchImageAsDataUri(`/api/v1/unique-tournament/${id}/image`, apiKey).then((uri) => {
          logoCache.set(`tournament:${id}`, uri);
        })
      );
    }

    await Promise.all(fetches);

    return sliced.map((event) => ({
      id: event.id,
      date: new Date(event.startTimestamp * 1000).toISOString(),
      homeTeam: event.homeTeam.name,
      homeLogo: logoCache.get(`team:${event.homeTeam.id}`) ?? "",
      awayTeam: event.awayTeam.name,
      awayLogo: logoCache.get(`team:${event.awayTeam.id}`) ?? "",
      league: event.tournament.uniqueTournament?.name ?? event.tournament.name,
      leagueLogo: event.tournament.uniqueTournament
        ? logoCache.get(`tournament:${event.tournament.uniqueTournament.id}`) ?? ""
        : "",
    }));
  } catch (error) {
    console.error(`[Calendar] Failed to fetch events for team ${teamId}:`, error);
    return [];
  }
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

  // Fetch fresh data: one call per team (much more efficient than date scanning)
  console.log(`[Calendar] Fetching fresh fixtures for ${teams.length} teams`);

  const supabase = await createClient();
  const results: { team: TeamMapping; fixtures: CachedFixture[] }[] = [];
  const seenFixtureIds = new Set<number>();
  const now = new Date().toISOString();

  // Fetch all teams in parallel
  const fetchResults = await Promise.all(
    teams.map(async (team) => ({
      team,
      fixtures: await fetchTeamNextEvents(team.api_team_id!, team.next_matches_count),
    }))
  );

  for (const { team, fixtures } of fetchResults) {
    // Update cache in DB
    await supabase
      .from("team_mappings")
      .update({
        cached_fixtures: JSON.parse(JSON.stringify(fixtures)),
        fixtures_updated_at: now,
      })
      .eq("id", team.id);

    // Deduplicate for display
    if (fixtures.length > 0) {
      const uniqueFixtures = fixtures.filter((f) => {
        if (seenFixtureIds.has(f.id)) return false;
        seenFixtureIds.add(f.id);
        return true;
      });
      if (uniqueFixtures.length > 0) {
        results.push({
          team: { ...team, cached_fixtures: fixtures, fixtures_updated_at: now },
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

/**
 * Force refresh fixtures by clearing the cache, then revalidate calendar page.
 */
export async function refreshCalendarFixtures() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Non connecte." };
  }

  // Clear cache to force re-fetch
  await supabase
    .from("team_mappings")
    .update({ cached_fixtures: null, fixtures_updated_at: null })
    .eq("user_id", user.id)
    .not("api_team_id", "is", null);

  revalidatePath("/calendar");

  return { success: true };
}
