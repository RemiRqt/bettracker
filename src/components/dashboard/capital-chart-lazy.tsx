"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/lib/types";

// Code-split recharts out of the dashboard's critical path: the chunk only
// loads after hydration, behind a skeleton.
const CapitalPanel = dynamic(
  () => import("./capital-panel").then((m) => m.CapitalPanel),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-xl" />,
  }
);

interface CapitalChartLazyProps {
  data: DashboardStats["capitalEvolution"];
  monthly: DashboardStats["monthlyPnl"];
}

export function CapitalChartLazy({ data, monthly }: CapitalChartLazyProps) {
  return <CapitalPanel data={data} monthly={monthly} />;
}
