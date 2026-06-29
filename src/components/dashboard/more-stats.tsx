"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatsTiles } from "@/components/dashboard/stats-cards";
import type { DashboardStats } from "@/lib/types";

export function MoreStats({ stats }: { stats: DashboardStats }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-card py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-secondary-foreground"
      >
        {open ? "Moins de stats" : "Plus de stats"}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="mt-1.5">
          <StatsTiles stats={stats} />
        </div>
      )}
    </div>
  );
}
