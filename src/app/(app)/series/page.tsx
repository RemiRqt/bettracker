import { createClient } from "@/lib/supabase/server";
import { EquipesPage } from "@/components/equipes/equipes-page";
import type { SeriesWithBets } from "@/lib/types";
import { getSubjectLinks, getTeamMappings, type CachedFixture, type TeamMapping } from "@/actions/teams";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mes Séries | BetTracker" };

export default async function EquipesRoute() {
  const supabase = await createClient();

  const [{ data: equipes }, { data: series }, links, mappings] =
    await Promise.all([
      supabase
        .from("equipes")
        .select("*")
        .order("name", { ascending: true }),
      supabase
        .from("series")
        .select("*, bets(*)")
        .order("created_at", { ascending: false }),
      getSubjectLinks(),
      getTeamMappings(),
    ]);

  const allSeries = (series ?? []) as SeriesWithBets[];

  // Build index: subject → TeamMapping[] via subject_links
  const byId = new Map(mappings.map((m) => [m.id, m]));
  const entitiesBySubject = new Map<string, TeamMapping[]>();
  for (const l of links) {
    const ent = byId.get(l.team_mapping_id);
    if (!ent) continue;
    const arr = entitiesBySubject.get(l.subject) ?? [];
    arr.push(ent);
    entitiesBySubject.set(l.subject, arr);
  }

  // Build logo map: first linked entity's logo_url per subject
  const logoMap: Record<string, string> = {};
  for (const [subject, entities] of entitiesBySubject) {
    const logo = entities[0]?.logo_url;
    if (logo) logoMap[subject] = logo;
  }

  // Build map: subject → next fixture (earliest future date among all linked entities)
  const nowMs = Date.now();
  const nextFixtureMap: Record<string, { date: string }> = {};
  for (const [subject, entities] of entitiesBySubject) {
    let earliest: string | null = null;
    for (const ent of entities) {
      const fixtures = (ent.cached_fixtures ?? []) as CachedFixture[];
      for (const f of fixtures) {
        if (new Date(f.date).getTime() > nowMs) {
          if (!earliest || f.date < earliest) earliest = f.date;
        }
      }
    }
    if (earliest) nextFixtureMap[subject] = { date: earliest };
  }

  // Build merged equipe data
  const mergedEquipes = (equipes ?? []).map((eq) => {
    const matchingSeries = allSeries.filter(
      (s) => s.subject === eq.name && s.bet_type === eq.bet_type
    );

    const activeSeries = matchingSeries.find((s) => s.status === "en_cours");

    let totalStake = 0;
    let totalGain = 0;
    let betsCount = 0;
    let wonCount = 0;
    let abandonedCount = 0;
    let enCoursCount = 0;
    let totalWonAmount = 0;
    let totalLostStake = 0;
    let potentialGains = 0;

    const sortedOldestFirst = [...matchingSeries].sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    );

    const seriesData = sortedOldestFirst.map((s, idx) => {
      const bets = s.bets.sort((a, b) => a.bet_number - b.bet_number);
      let sStake = 0;
      let sGain = 0;

      for (const bet of bets) {
        sStake += bet.stake;
        if (bet.result === "gagne") {
          sGain += bet.stake * bet.odds;
          totalWonAmount += bet.stake * bet.odds;
        } else if (bet.result === "perdu") {
          totalLostStake += bet.stake;
        } else {
          potentialGains += bet.stake * bet.odds;
        }
      }

      const sNetProfit = sGain - sStake;
      const sRoi = sStake > 0 ? (sNetProfit / sStake) * 100 : 0;

      totalStake += sStake;
      totalGain += sGain;
      betsCount += bets.length;

      if (s.status === "gagnee") wonCount++;
      else if (s.status === "abandonnee") abandonedCount++;
      else enCoursCount++;

      return {
        id: s.id,
        seriesNumber: idx + 1,
        status: s.status,
        target_gain: s.target_gain,
        created_at: s.created_at,
        bets: bets.map((b) => ({
          id: b.id,
          bet_number: b.bet_number,
          odds: b.odds,
          stake: b.stake,
          potential_net: b.potential_net,
          result: b.result,
          created_at: b.created_at,
        })),
        totalStake: sStake,
        netProfit: sNetProfit,
        roi: sRoi,
      };
    });

    seriesData.reverse();

    const netProfit = totalGain - totalStake;
    const roi = totalStake > 0 ? (netProfit / totalStake) * 100 : 0;

    let lastBetDate = "";
    for (const s of seriesData) {
      for (const b of s.bets) {
        if (b.created_at > lastBetDate) lastBetDate = b.created_at;
      }
    }

    const sortedByDate = [...seriesData].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
    const lastSeriesStatus = sortedByDate[0]?.status ?? "";

    return {
      equipeId: eq.id,
      name: eq.name,
      bet_type: eq.bet_type,
      sport: eq.sport,
      totalStake,
      netProfit,
      roi,
      seriesCount: matchingSeries.length,
      betsCount,
      wonCount,
      abandonedCount,
      enCoursCount,
      series: seriesData,
      lastBetDate,
      lastSeriesStatus,
      totalWonAmount: Math.round(totalWonAmount * 100) / 100,
      totalLostStake: Math.round(totalLostStake * 100) / 100,
      potentialGains: Math.round(potentialGains * 100) / 100,
      activeSeries: activeSeries
        ? {
            id: activeSeries.id,
            target_gain: activeSeries.target_gain,
            betCount: activeSeries.bets.length,
            sumStakes: activeSeries.bets.reduce((s, b) => s + b.stake, 0),
            hasPendingBet: activeSeries.bets.some((b) => b.result === null),
          }
        : null,
    };
  });

  // Sort: equipes without series first (newest created), then by last bet date descending
  mergedEquipes.sort((a, b) => {
    const aEmpty = a.seriesCount === 0;
    const bEmpty = b.seriesCount === 0;
    if (aEmpty && !bEmpty) return -1;
    if (!aEmpty && bEmpty) return 1;
    if (aEmpty && bEmpty) return 0;
    return b.lastBetDate.localeCompare(a.lastBetDate);
  });

  return <EquipesPage equipes={mergedEquipes} logoMap={logoMap} nextFixtureMap={nextFixtureMap} />;
}
