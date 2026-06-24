import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardStats } from "@/actions/stats";
import { StatsHero } from "@/components/dashboard/stats-cards";
import { MoreStats } from "@/components/dashboard/more-stats";
import { CapitalChartLazy } from "@/components/dashboard/capital-chart-lazy";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard | BetTracker" };

export default function DashboardPage() {
  return (
    <div className="space-y-3">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const stats = await getDashboardStats();

  return (
    <>
      <StatsHero stats={stats} />

      <div className="flex h-[22rem] flex-col rounded-xl bg-[#1e293b] p-3">
        <h3 className="mb-2 flex-shrink-0 text-[10px] uppercase tracking-wide text-slate-400">
          Évolution du capital
        </h3>
        <div className="min-h-0 flex-1">
          <CapitalChartLazy data={stats.capitalEvolution} />
        </div>
      </div>

      <MoreStats stats={stats} />
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-[22rem] w-full rounded-xl" />
      <Skeleton className="h-9 w-full rounded-xl" />
    </>
  );
}
