import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ParisPage } from "@/components/paris/paris-page";

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

  // Fetch bets and team mappings in parallel
  const [{ data: bets }, { data: teamMappings }] = await Promise.all([
    supabase
      .from("bets")
      .select(
        "*, series!inner(id, subject, bet_type, status, target_gain, user_id)"
      )
      .eq("series.user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("team_mappings")
      .select("subject, logo_url, api_team_id, is_club"),
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

  // Build logo map: clubs first, then non-clubs inherit via api_team_id
  const logoMap: Record<string, string> = {};
  const apiIdToLogo: Record<number, string> = {};
  for (const m of teamMappings ?? []) {
    if (m.is_club && m.logo_url) {
      logoMap[m.subject] = m.logo_url;
      if (m.api_team_id) apiIdToLogo[m.api_team_id] = m.logo_url;
    }
  }
  for (const m of teamMappings ?? []) {
    if (!m.is_club && !logoMap[m.subject] && m.api_team_id && apiIdToLogo[m.api_team_id]) {
      logoMap[m.subject] = apiIdToLogo[m.api_team_id];
    }
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
