import { getDashboardStats } from "@/actions/stats";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CapitalChart } from "@/components/dashboard/capital-chart";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div
      className="flex flex-col gap-2 overflow-hidden"
      style={{
        height:
          "calc(100dvh - 3.5rem - 3.75rem - env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex-shrink-0">
        <StatsCards stats={stats} />
      </div>

      <div className="flex-1 min-h-0 rounded-xl bg-[#1e293b] p-3 flex flex-col">
        <h3 className="text-[10px] uppercase tracking-wide text-slate-400 mb-2 flex-shrink-0">
          Évolution du capital
        </h3>
        <div className="flex-1 min-h-0">
          <CapitalChart data={stats.capitalEvolution} />
        </div>
      </div>
    </div>
  );
}
