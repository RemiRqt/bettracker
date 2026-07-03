import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ParisPage } from "@/components/paris/paris-page";
import type { ExistingSubject } from "@/components/paris/bet-form";
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
        "*, series!inner(id, subject, bet_type, status, target_gain, user_id, kind, sport)"
      )
      .eq("series.user_id", user.id)
      .order("created_at", { ascending: false }),
    getSubjectLinks(),
    getTeamMappings(),
  ]);

  // Fetch all series (subject+bet_type grouping + active-series context)
  const { data: allSeries } = await supabase
    .from("series")
    .select("id, subject, bet_type, status, target_gain, sport, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Aggregate bets per series (count + sum of stakes) for the active-series context
  const betAgg = new Map<string, { count: number; sum: number }>();
  for (const b of bets ?? []) {
    const a = betAgg.get(b.series_id) ?? { count: 0, sum: 0 };
    a.count += 1;
    a.sum += b.stake;
    betAgg.set(b.series_id, a);
  }

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

  // Group series by subject+bet_type: lastStatus (most recent) + active series
  const groups = new Map<string, ExistingSubject>();
  for (const s of allSeries ?? []) {
    const key = `${s.subject}::${s.bet_type}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        subject: s.subject,
        betType: s.bet_type,
        sport: s.sport,
        lastStatus: s.status,
        logoUrl: logoMap[s.subject],
      };
      groups.set(key, g);
    }
    if (s.status === "en_cours" && !g.activeSeries) {
      const agg = betAgg.get(s.id) ?? { count: 0, sum: 0 };
      g.activeSeries = {
        id: s.id,
        targetGain: s.target_gain,
        betCount: agg.count,
        sumStakes: agg.sum,
      };
    }
  }
  const existingSubjects = Array.from(groups.values());

  const teamMappings = mappings
    .filter((m) => m.is_club)
    .map((m) => ({
      subject: m.subject,
      apiTeamId: m.api_team_id,
      logoUrl: m.logo_url,
      sport: m.sport,
    }));

  return (
    <Suspense>
      <ParisPage
        bets={bets ?? []}
        existingSubjects={existingSubjects}
        teamMappings={teamMappings}
        logoMap={logoMap}
      />
    </Suspense>
  );
}
