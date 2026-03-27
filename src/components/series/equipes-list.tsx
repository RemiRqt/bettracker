"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronRight, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BET_TYPES } from "@/lib/constants";
import { formatEuros, formatPercent, cn } from "@/lib/utils";
import { EquipeSeriesItem } from "@/components/series/equipe-series-item";

export type EquipeSeries = {
  id: string;
  status: string;
  target_gain: number;
  created_at: string;
  bets: {
    id: string;
    bet_number: number;
    odds: number;
    stake: number;
    potential_net: number;
    result: string | null;
    created_at: string;
  }[];
  totalStake: number;
  netProfit: number;
  roi: number;
};

export type Equipe = {
  subject: string;
  bet_type: string;
  totalStake: number;
  netProfit: number;
  roi: number;
  seriesCount: number;
  betsCount: number;
  wonCount: number;
  abandonedCount: number;
  enCoursCount: number;
  series: EquipeSeries[];
};

interface EquipesListProps {
  equipes: Equipe[];
}

export function EquipesList({ equipes }: EquipesListProps) {
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filtered = equipes.filter((eq) =>
    eq.subject.toLowerCase().includes(search.toLowerCase())
  );

  function toggleExpand(key: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Rechercher une équipe..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-[#1e293b] border-slate-700 text-slate-200 placeholder:text-slate-500 focus-visible:ring-emerald-500"
        />
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Inbox className="h-10 w-10 mb-3 text-slate-600" />
          <p className="text-sm">Aucune équipe trouvée.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((equipe) => {
            const key = `${equipe.subject}:::${equipe.bet_type}`;
            const isExpanded = expandedIds.has(key);
            const betTypeLabel =
              BET_TYPES[equipe.bet_type as keyof typeof BET_TYPES] ??
              equipe.bet_type;

            // Progress bar proportions
            const total = equipe.seriesCount;
            const wonPct = total > 0 ? (equipe.wonCount / total) * 100 : 0;
            const abandonedPct =
              total > 0 ? (equipe.abandonedCount / total) * 100 : 0;
            const enCoursPct =
              total > 0 ? (equipe.enCoursCount / total) * 100 : 0;

            return (
              <div key={key} className="rounded-xl bg-[#1e293b] overflow-hidden">
                {/* Card header - clickable */}
                <button
                  onClick={() => toggleExpand(key)}
                  className="w-full text-left p-4 space-y-2.5 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Row 1: name + type badge + chevron */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg font-bold text-slate-100 truncate">
                        {equipe.subject}
                      </span>
                      <Badge className="shrink-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                        {betTypeLabel}
                      </Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-500 shrink-0" />
                    )}
                  </div>

                  {/* Row 2: gain/loss + ROI */}
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "font-bold text-sm",
                        equipe.netProfit >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      )}
                    >
                      {equipe.netProfit >= 0 ? "+" : ""}
                      {formatEuros(equipe.netProfit)}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        equipe.roi >= 0 ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      ROI {formatPercent(equipe.roi)}
                    </span>
                  </div>

                  {/* Row 3: series + bets count */}
                  <p className="text-xs text-slate-500">
                    {equipe.seriesCount} série{equipe.seriesCount > 1 ? "s" : ""}{" "}
                    &middot; {equipe.betsCount} pari{equipe.betsCount > 1 ? "s" : ""}
                  </p>

                  {/* Row 4: progress bar */}
                  <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-700/50">
                    {wonPct > 0 && (
                      <div
                        className="bg-emerald-500 transition-all"
                        style={{ width: `${wonPct}%` }}
                      />
                    )}
                    {abandonedPct > 0 && (
                      <div
                        className="bg-red-500 transition-all"
                        style={{ width: `${abandonedPct}%` }}
                      />
                    )}
                    {enCoursPct > 0 && (
                      <div
                        className="bg-blue-500 transition-all"
                        style={{ width: `${enCoursPct}%` }}
                      />
                    )}
                  </div>
                </button>

                {/* Expanded: individual series */}
                {isExpanded && (
                  <div className="border-t border-slate-700/50 px-4 pb-4 pt-2 space-y-2">
                    {equipe.series.map((s, index) => (
                      <EquipeSeriesItem
                        key={s.id}
                        series={s}
                        index={index + 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
