"use server";

import { createClient } from "@/lib/supabase/server";
import { LATEST_RELEASE_ID, unseenReleases, type Release } from "@/lib/releases";

/**
 * Nouveautés pas encore vues. Un compte créé après la dernière version ne voit
 * pas l'historique (on le marque à jour directement).
 */
export async function getUnseenReleases(): Promise<Release[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_settings")
    .select("last_seen_release")
    .eq("user_id", user.id)
    .maybeSingle();
  const lastSeen = data?.last_seen_release ?? null;

  if (!lastSeen && user.created_at.slice(0, 10) > LATEST_RELEASE_ID) {
    await markReleasesSeen();
    return [];
  }
  return unseenReleases(lastSeen);
}

export async function markReleasesSeen(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("user_settings")
    .upsert(
      { user_id: user.id, last_seen_release: LATEST_RELEASE_ID, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
}
