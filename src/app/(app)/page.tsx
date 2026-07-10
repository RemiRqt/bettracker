import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardStats } from "@/actions/stats";
import { getActionItems } from "@/actions/series";
import { StatsHero } from "@/components/dashboard/stats-cards";
import { ActionItems } from "@/components/dashboard/action-items";
import { MoreStats } from "@/components/dashboard/more-stats";

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
  const [stats, actionItems] = await Promise.all([
    getDashboardStats(),
    getActionItems(),
  ]);

  return (
    <>
      <StatsHero stats={stats} />

      <ActionItems items={actionItems} />

      <MoreStats stats={stats} />
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-9 w-full rounded-xl" />
    </>
  );
}
