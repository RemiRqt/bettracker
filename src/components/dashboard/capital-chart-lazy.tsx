"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Code-split recharts out of the dashboard's critical path: the chunk only
// loads after hydration, behind a skeleton.
const CapitalChart = dynamic(
  () => import("./capital-chart").then((m) => m.CapitalChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-xl" />,
  }
);

interface CapitalChartLazyProps {
  data: {
    date: string;
    capital: number;
    deposits: number;
    valeur: number;
    encaisse: number;
  }[];
}

export function CapitalChartLazy({ data }: CapitalChartLazyProps) {
  return <CapitalChart data={data} />;
}
