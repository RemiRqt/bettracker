import { getDashboardStats } from "@/actions/stats";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SuccessByRank } from "@/components/dashboard/success-by-rank";
import { DistributionChart } from "@/components/dashboard/distribution-chart";
import { ActiveSeriesRisk } from "@/components/dashboard/active-series-risk";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>

      <StatsCards
        stats={{
          netGain: stats.netGain,
          roi: stats.roi,
          totalStakes: stats.totalStakes,
          activeSeriesCount: stats.activeSeriesCount,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SuccessByRank data={stats.successByRank} />
        <DistributionChart data={stats.distributionByType} />
      </div>

      <ActiveSeriesRisk activeSeries={stats.activeSeries} />
    </div>
  );
}
