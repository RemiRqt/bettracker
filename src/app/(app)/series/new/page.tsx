import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ParisPage } from "@/components/paris/paris-page";
import { getSubjectLinks, getTeamMappings } from "@/actions/teams";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nouvelle Série | BetTracker" };

export default async function NewSeriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch bets, subject_links and team_mappings in parallel
  const [{ data: bets }, links, mappings] = await Promise.all([
    supabase
      .from("bets")
      .select(
        "*, series!inner(id, subject, bet_type, status, target_gain, user_id)"
      )
      .eq("series.user_id", user.id)
      .order("created_at", { ascending: false }),
    getSubjectLinks(),
    getTeamMappings(),
  ]);

  // Fetch all series to build grouped teams dropdown
  const { data: allSeries } = await supabase
    .from("series")
    .select("subject, bet_type, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Group series by subject+bet_type, determine lastStatus from most recent
  const groupMap = new Map<
    string,
    { subject: string; bet_type: string; lastStatus: string }
  >();

  if (allSeries) {
    for (const s of allSeries) {
      const key = `${s.subject}::${s.bet_type}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          subject: s.subject,
          bet_type: s.bet_type,
          lastStatus: s.status,
        });
      }
    }
  }

  const statusOrder: Record<string, number> = {
    en_cours: 0,
    abandonnee: 1,
    gagnee: 2,
  };

  const existingTeams = Array.from(groupMap.values()).sort(
    (a, b) =>
      (statusOrder[a.lastStatus] ?? 99) - (statusOrder[b.lastStatus] ?? 99)
  );

  const existingTeamsRaw = existingTeams.map((t) => ({
    subject: t.subject,
    bet_type: t.bet_type,
  }));

  // Build logo map via subject_links resolution (canonical pattern)
  const byId = new Map(mappings.map((m) => [m.id, m]));
  const entitiesBySubject = new Map<string, typeof mappings[number][]>();
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
      <ParisPage
        bets={bets ?? []}
        existingTeams={existingTeams}
        existingTeamsRaw={existingTeamsRaw}
        logoMap={logoMap}
      />
    </Suspense>
  );
}
