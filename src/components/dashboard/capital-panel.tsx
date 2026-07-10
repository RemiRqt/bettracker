"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CapitalChart } from "./capital-chart";
import { MonthlyBarChart } from "./monthly-bar-chart";
import type { DashboardStats } from "@/lib/types";

type View = "courbe" | "barres";

const VIEWS: { key: View; label: string }[] = [
  { key: "courbe", label: "Courbe" },
  { key: "barres", label: "Barres" },
];

interface CapitalPanelProps {
  data: DashboardStats["capitalEvolution"];
  monthly: DashboardStats["monthlyPnl"];
}

export function CapitalPanel({ data, monthly }: CapitalPanelProps) {
  const [view, setView] = useState<View>("courbe");

  return (
    <div className="flex h-full flex-col gap-2">
      {/* View switch */}
      <div className="flex flex-shrink-0 justify-end">
        <div className="inline-flex gap-0.5 rounded-lg bg-background p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all active:scale-95",
                view === v.key
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-secondary-foreground"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {view === "courbe" ? (
          <CapitalChart data={data} />
        ) : (
          <MonthlyBarChart data={monthly} />
        )}
      </div>
    </div>
  );
}
