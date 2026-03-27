import { getDashboardStats } from "@/actions/stats";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CapitalChart } from "@/components/dashboard/capital-chart";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-2 py-2">
      <StatsCards stats={stats} />

      <div className="rounded-xl bg-[#1e293b] p-3">
        <h3 className="text-[10px] uppercase tracking-wide text-slate-400 mb-3">
          Évolution du capital
        </h3>
        <CapitalChart data={stats.capitalEvolution} />
      </div>
    </div>
  );
}
