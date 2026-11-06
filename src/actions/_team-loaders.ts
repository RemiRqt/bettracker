import { cache } from "react";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CachedFixture } from "@/lib/football-data";

// Module serveur partagé (pas "use server") : types + loaders `cache()` de niveau requête,
// importés par teams.ts, team-calendar.ts et subject-links.ts pour partager la même instance.

export interface TeamMapping {
  id: string;
  user_id: string;
  subject: string;
  sport: string;
  api_team_id: number | null;
  logo_url: string | null;
  is_club: boolean;
  kind: string;
  country: string | null;
  provider: string;
  is_followed: boolean;
  next_matches_count: number;
  cached_fixtures: CachedFixture[] | null;
  fixtures_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

const MAPPING_COLS =
  "id, subject, api_team_id, logo_url, sport, is_club, kind, country, provider, is_followed, next_matches_count, fixtures_updated_at";
const MAPPING_COLS_WITH_FIXTURES = `${MAPPING_COLS}, cached_fixtures`;

/** Mappings du user, mis en cache pour la requête (plusieurs appelants par page). */
export const loadTeamMappings = cache(async (userId: string, withFixtures: boolean) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_mappings")
    .select(withFixtures ? MAPPING_COLS_WITH_FIXTURES : MAPPING_COLS)
    .eq("user_id", userId)
    .order("subject", { ascending: true });
  if (error) throw new Error(`Erreur lors de la recuperation des equipes: ${error.message}`);
  return ((data ?? []) as unknown as TeamMapping[]).map((m) =>
    withFixtures ? m : { ...m, cached_fixtures: null },
  );
});

/** Clubs suivis avec id API (calendrier), filtrés en base, mis en cache pour la requête. */
export const loadCalendarTeams = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_mappings")
    .select(MAPPING_COLS_WITH_FIXTURES)
    .eq("user_id", userId)
    .eq("is_club", true)
    .eq("is_followed", true)
    .not("api_team_id", "is", null);
  return ((data ?? []) as unknown as TeamMapping[]);
});

export function revalidateTeamPaths() {
  revalidatePath("/profile");
  revalidatePath("/series");
  revalidatePath("/calendar");
}

export interface SubjectLink {
  id: string;
  subject: string;
  team_mapping_id: string;
  created_at: string;
}

