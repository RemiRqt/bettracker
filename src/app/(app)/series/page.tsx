import { createClient } from "@/lib/supabase/server";
import { EquipesList } from "@/components/series/equipes-list";
import type { SeriesWithBets } from "@/lib/types";

export default async function EquipesPage() {
  const supabase = await createClient();

  const { data: series, error } = await supabase
    .from("series")
    .select("*, bets(*)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erreur lors du chargement des séries : ${error.message}`);
  }

  const allSeries = (series ?? []) as SeriesWithBets[];

  // Group by subject + bet_type
  const groupMap = new Map<
    string,
    {
      subject: string;
      bet_type: string;
      seriesList: SeriesWithBets[];
    }
  >();

  for (const s of allSeries) {
    const key = `${s.subject}:::${s.bet_type}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        subject: s.subject,
        bet_type: s.bet_type,
        seriesList: [],
      });
    }
    groupMap.get(key)!.seriesList.push(s);
  }

  const equipes = Array.from(groupMap.values()).map((group) => {
    let totalStake = 0;
    let totalGain = 0;
    let betsCount = 0;
    let wonCount = 0;
    let abandonedCount = 0;
    let enCoursCount = 0;
    let totalWonAmount = 0;
    let totalLostStake = 0;
    let potentialGains = 0;

    const seriesData = group.seriesList.map((s) => {
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

    const netProfit = totalGain - totalStake;
    const roi = totalStake > 0 ? (netProfit / totalStake) * 100 : 0;

    // Find latest bet date across all series
    let lastBetDate = "";
    for (const s of seriesData) {
      for (const b of s.bets) {
        if (b.created_at > lastBetDate) lastBetDate = b.created_at;
      }
    }

    // Find the status of the most recent series
    const sortedByDate = [...seriesData].sort(
      (a, b) => b.created_at.localeCompare(a.created_at)
    );
    const lastSeriesStatus = sortedByDate[0]?.status ?? "";

    return {
      subject: group.subject,
      bet_type: group.bet_type,
      totalStake,
      netProfit,
      roi,
      seriesCount: group.seriesList.length,
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
    };
  });

  // Sort by last bet date descending (most recent first)
  equipes.sort((a, b) => b.lastBetDate.localeCompare(a.lastBetDate));

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-slate-100">
        Équipes
      </h1>
      <EquipesList equipes={equipes} />
    </div>
  );
}
