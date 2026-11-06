"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { revalidateTeamPaths, type SubjectLink } from "@/actions/_team-loaders";

export async function getSubjectLinks(): Promise<SubjectLink[]> {
  const supabase = await createClient();
  const { user, error: authError } = await getAuthUser();
  if (authError || !user) throw new Error("Vous devez etre connecte.");

  const { data, error } = await supabase
    .from("subject_links")
    .select("id, subject, team_mapping_id, created_at")
    .eq("user_id", user.id);
  if (error) throw new Error(`Erreur liens: ${error.message}`);
  return (data as SubjectLink[]) || [];
}

export async function linkSubject(subject: string, teamMappingId: string) {
  const supabase = await createClient();
  const { user, error: authError } = await getAuthUser();
  if (authError || !user) throw new Error("Vous devez etre connecte.");
  if (!subject?.trim()) return { error: "Le sujet est requis." };

  const { error } = await supabase
    .from("subject_links")
    .upsert(
      { user_id: user.id, subject: subject.trim(), team_mapping_id: teamMappingId },
      { onConflict: "user_id,subject,team_mapping_id", ignoreDuplicates: true }
    );
  if (error) return { error: `Erreur lors du lien: ${error.message}` };

  revalidateTeamPaths();
  return { success: true };
}

export async function unlinkSubject(subject: string, teamMappingId: string) {
  const supabase = await createClient();
  const { user, error: authError } = await getAuthUser();
  if (authError || !user) throw new Error("Vous devez etre connecte.");

  const { error } = await supabase
    .from("subject_links")
    .delete()
    .eq("user_id", user.id)
    .eq("subject", subject)
    .eq("team_mapping_id", teamMappingId);
  if (error) return { error: `Erreur lors du retrait: ${error.message}` };

  revalidateTeamPaths();
  return { success: true };
}
