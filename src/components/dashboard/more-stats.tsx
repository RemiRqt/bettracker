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
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1e293b] py-2 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
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
