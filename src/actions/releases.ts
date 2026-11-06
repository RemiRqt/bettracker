"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { LATEST_RELEASE_ID, unseenReleases, type Release } from "@/lib/releases";

/**
 * Nouveautés pas encore vues. Un compte créé après la dernière version ne voit
 * pas l'historique (on le marque à jour directement).
 */
export async function getUnseenReleases(): Promise<Release[]> {
  const { user } = await getAuthUser();
  if (!user) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_settings")
    .select("last_seen_release")
    .eq("user_id", user.id)
    .maybeSingle();
  const lastSeen = data?.last_seen_release ?? null;

  if (!lastSeen && (await accountCreatedAfterLatestRelease())) {
    await markReleasesSeen();
    return [];
  }
  return unseenReleases(lastSeen);
}

/** Seul cas où on interroge Supabase Auth (created_at absent du jeton) : jamais vu de nouveautés. */
async function accountCreatedAfterLatestRelease(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return !!data.user && data.user.created_at.slice(0, 10) > LATEST_RELEASE_ID;
}

export async function markReleasesSeen(): Promise<void> {
  const { user } = await getAuthUser();
  if (!user) return;
  const supabase = await createClient();
  await supabase
    .from("user_settings")
    .upsert(
      { user_id: user.id, last_seen_release: LATEST_RELEASE_ID, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
}
