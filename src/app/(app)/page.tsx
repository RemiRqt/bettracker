import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardStats } from "@/actions/stats";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CapitalChartLazy } from "@/components/dashboard/capital-chart-lazy";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard | BetTracker" };

const CONTENT_HEIGHT =
  "calc(100dvh - 3.5rem - 3.75rem - env(safe-area-inset-bottom, 0px))";

export default function DashboardPage() {
  return (
    <div
      className="flex flex-col gap-2 overflow-hidden"
      style={{ height: CONTENT_HEIGHT }}
    >
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
      <div className="flex-shrink-0">
        <StatsCards stats={stats} />
      </div>

      <div className="flex-1 min-h-0 rounded-xl bg-[#1e293b] p-3 flex flex-col">
        <h3 className="text-[10px] uppercase tracking-wide text-slate-400 mb-2 flex-shrink-0">
          Évolution du capital
        </h3>
        <div className="flex-1 min-h-0">
          <CapitalChartLazy data={stats.capitalEvolution} />
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="flex-shrink-0">
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
      <div className="flex-1 min-h-0 rounded-xl bg-[#1e293b] p-3">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
    </>
  );
}
