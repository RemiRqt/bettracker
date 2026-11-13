"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { loadTeamMappings, revalidateTeamPaths, type TeamMapping } from "@/actions/_team-loaders";

export type { CachedFixture } from "@/lib/football-data";
export type { TeamMapping, SubjectLink } from "@/actions/_team-loaders";

/**
 * Mappings du user. Sans `withFixtures`, le jsonb `cached_fixtures` (lourd) n'est pas lu :
 * seuls les écrans qui calculent le prochain match en ont besoin.
 */
export async function getTeamMappings(opts: { withFixtures?: boolean } = {}): Promise<TeamMapping[]> {
  const { user, error: authError } = await getAuthUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  return loadTeamMappings(user.id, !!opts.withFixtures);
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

function insertClubMapping(
  supabase: SupabaseServer,
  userId: string,
  club: { apiTeamId: number; name: string; crestUrl: string; kind?: "club" | "national"; country?: string },
) {
  return supabase
    .from("team_mappings")
    .insert({
      user_id: userId,
      subject: club.name,
      api_team_id: club.apiTeamId,
      logo_url: club.crestUrl,
      sport: "football",
      is_club: true,
      is_followed: false,
      kind: club.kind ?? "club",
      country: club.country ?? null,
      provider: "football-data",
    })
    .select("id")
    .single();
}

/**
 * Add an API club or national team as a separate record (is_club=true).
 * Stores the direct crest URL from football-data.org.
 */
export async function addClub(apiTeamId: number, name: string, crestUrl: string, options?: { kind?: "club" | "national"; country?: string }) {
  const supabase = await createClient();

  const { user, error: authError } = await getAuthUser();
  if (authError || !user) throw new Error("Vous devez etre connecte.");

  const { data: existing } = await supabase
    .from("team_mappings")
    .select("id")
    .eq("user_id", user.id)
    .eq("api_team_id", apiTeamId)
    .eq("is_club", true)
    .maybeSingle();
  if (existing) return { error: "Cette equipe est deja ajoutee." };

  const { data: inserted, error } = await insertClubMapping(supabase, user.id, {
    apiTeamId,
    name,
    crestUrl,
    ...options,
  });
  if (error) return { error: `Erreur: ${error.message}` };

  // Auto-lien : une serie portant le meme nom que l'entite herite de son logo/calendrier
  // (compat avec l'ancien match-par-nom, desormais materialise en subject_links).
  if (inserted) {
    await supabase
      .from("subject_links")
      .upsert({ user_id: user.id, subject: name, team_mapping_id: inserted.id }, { onConflict: "user_id,subject,team_mapping_id", ignoreDuplicates: true });
  }

  revalidateTeamPaths();
  return { success: true };
}

export async function toggleFollow(subject: string) {
  const supabase = await createClient();

  const { user, error: authError } = await getAuthUser();

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
    const { error } = await supabase.from("team_mappings").insert({
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

export async function deleteTeamMapping(id: string) {
  const supabase = await createClient();

  const { user, error: authError } = await getAuthUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  const { error } = await supabase.from("team_mappings").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return { error: `Erreur lors de la suppression: ${error.message}` };
  }

  revalidateTeamPaths();
  return { success: true };
}

function selectAllMappings(supabase: SupabaseServer, userId: string) {
  return supabase
    .from("team_mappings")
    .select(
      "id, subject, api_team_id, logo_url, sport, is_club, kind, country, provider, is_followed, next_matches_count, cached_fixtures, fixtures_updated_at",
    )
    .eq("user_id", userId)
    .order("subject", { ascending: true });
}

/** Subjects des séries du user qui n'ont pas encore de mapping (+ mappings existants). */
async function findMissingSubjects(supabase: SupabaseServer, userId: string) {
  // Get all unique subjects from the user's series
  const { data: seriesData } = await supabase.from("series").select("subject").eq("user_id", userId);

  const uniqueSubjects = [...new Set((seriesData || []).map((s) => s.subject))];

  // Get existing team mappings
  const { data: existingMappings } = await selectAllMappings(supabase, userId);

  const existingSubjects = new Set((existingMappings || []).map((m: { subject: string }) => m.subject));

  // Find subjects that don't have a mapping yet
  const missingSubjects = uniqueSubjects.filter((subject) => !existingSubjects.has(subject));
  return { existingMappings, missingSubjects };
}

export async function ensureTeamMappings(): Promise<TeamMapping[]> {
  const supabase = await createClient();

  const { user, error: authError } = await getAuthUser();

  if (authError || !user) {
    return [];
  }

  const { existingMappings, missingSubjects } = await findMissingSubjects(supabase, user.id);

  // Cas courant : rien à créer, on renvoie directement la liste lue.
  if (missingSubjects.length === 0) {
    return (existingMappings as TeamMapping[]) || [];
  }

  // Create mappings for missing subjects
  {
    await supabase.from("team_mappings").insert(
      missingSubjects.map((subject) => ({
        user_id: user.id,
        subject,
        sport: "football",
        is_followed: false,
        next_matches_count: 2,
      })),
    );
  }

  // Return the full updated list
  const { data: allMappings } = await selectAllMappings(supabase, user.id);

  return (allMappings as TeamMapping[]) || [];
}
