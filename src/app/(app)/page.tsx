import { getDashboardStats } from "@/actions/stats";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CapitalChart } from "@/components/dashboard/capital-chart";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-4 md:space-y-6">
      <StatsCards stats={stats} />

      {/* Capital evolution chart */}
      <div className="rounded-xl bg-[#1e293b] p-4">
        <h3 className="text-sm uppercase tracking-wide text-slate-400 mb-4">
          &Eacute;volution du capital
        </h3>
        <CapitalChart data={stats.capitalEvolution} />
      </div>
    </div>
  );
}
