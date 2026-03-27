import { getDashboardStats } from "@/actions/stats";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SuccessByRank } from "@/components/dashboard/success-by-rank";
import { DistributionChart } from "@/components/dashboard/distribution-chart";
import { ActiveSeriesRisk } from "@/components/dashboard/active-series-risk";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-xl font-semibold text-slate-200">
        Résumé
      </h2>

      <StatsCards
        stats={{
          netGain: stats.netGain,
          roi: stats.roi,
          totalStakes: stats.totalStakes,
          activeSeriesCount: stats.activeSeriesCount,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <SuccessByRank data={stats.successByRank} />
        <DistributionChart data={stats.distributionByType} />
      </div>

      <ActiveSeriesRisk activeSeries={stats.activeSeries} />
    </div>
  );
}
