import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ParisPage } from "@/components/paris/paris-page";
import { getSubjectLinks, getTeamMappings } from "@/actions/teams";

export const dynamic = "force-dynamic";

export const metadata = { title: "Paris | BetTracker" };

export default async function ParisRoute() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // La liste des paris + logos (le form de création est global, cf. BetModalProvider).
  const [{ data: bets }, links, mappings] = await Promise.all([
    supabase
      .from("bets")
      .select(
        "*, series!inner(id, subject, bet_type, status, target_gain, user_id, kind, sport)"
      )
      .eq("series.user_id", user.id)
      .order("created_at", { ascending: false }),
    getSubjectLinks(),
    getTeamMappings(),
  ]);

  // Build logo map via subject_links resolution (canonical pattern)
  const byId = new Map(mappings.map((m) => [m.id, m]));
  const entitiesBySubject = new Map<string, (typeof mappings)[number][]>();
  for (const l of links) {
    const ent = byId.get(l.team_mapping_id);
    if (!ent) continue;
    const arr = entitiesBySubject.get(l.subject) ?? [];
    arr.push(ent);
    entitiesBySubject.set(l.subject, arr);
  }
  const logoMap: Record<string, string> = {};
  for (const [subject, entities] of entitiesBySubject) {
    const logo = entities[0]?.logo_url;
    if (logo) logoMap[subject] = logo;
  }

  return (
    <Suspense>
      <ParisPage bets={bets ?? []} logoMap={logoMap} />
    </Suspense>
  );
}
