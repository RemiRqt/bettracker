"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronRight, Inbox, ArrowUpDown } from "lucide-react";
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
  lastBetDate: string;
  lastSeriesStatus: string;
};

type SortKey = "date" | "gains" | "paris";
type FilterKey = "tous" | "en_cours" | "gagne" | "perdu" | "pause";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Récent" },
  { key: "gains", label: "Gains" },
  { key: "paris", label: "Paris" },
];

const FILTER_OPTIONS: { key: FilterKey; label: string; color: string }[] = [
  { key: "tous", label: "Tous", color: "text-slate-300 border-slate-600" },
  { key: "en_cours", label: "En cours", color: "text-blue-400 border-blue-500/30" },
  { key: "gagne", label: "Gagné", color: "text-emerald-400 border-emerald-500/30" },
  { key: "perdu", label: "Perdu", color: "text-red-400 border-red-500/30" },
  { key: "pause", label: "En pause", color: "text-amber-400 border-amber-500/30" },
];

interface EquipesListProps {
  equipes: Equipe[];
}

export function EquipesList({ equipes }: EquipesListProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [filterBy, setFilterBy] = useState<FilterKey>("tous");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const counts = useMemo(() => {
    const c = { tous: equipes.length, en_cours: 0, gagne: 0, perdu: 0, pause: 0 };
    for (const eq of equipes) {
      if (eq.enCoursCount > 0) c.en_cours++;
      if (eq.netProfit > 0) c.gagne++;
      if (eq.netProfit < 0) c.perdu++;
      if (eq.lastSeriesStatus === "abandonnee" && eq.enCoursCount === 0) c.pause++;
    }
    return c;
  }, [equipes]);

  const filtered = equipes.filter((eq) => {
    if (!eq.subject.toLowerCase().includes(search.toLowerCase())) return false;
    switch (filterBy) {
      case "en_cours":
        return eq.enCoursCount > 0;
      case "gagne":
        return eq.netProfit > 0;
      case "perdu":
        return eq.netProfit < 0;
      case "pause":
        return eq.lastSeriesStatus === "abandonnee" && eq.enCoursCount === 0;
      default:
        return true;
    }
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return b.lastBetDate.localeCompare(a.lastBetDate);
      case "gains":
        return b.netProfit - a.netProfit;
      case "paris":
        return b.betsCount - a.betsCount;
      default:
        return 0;
    }
  });

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
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#1e293b] border border-slate-700 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilterBy(opt.key)}
            className={cn(
              "flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border",
              filterBy === opt.key
                ? `bg-white/10 ${opt.color}`
                : "bg-transparent text-slate-500 border-slate-700/50 hover:border-slate-600"
            )}
          >
            {opt.label}
            <span className="ml-1 opacity-60">{counts[opt.key]}</span>
          </button>
        ))}
      </div>

      {/* Sort buttons */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              sortBy === opt.key
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-[#1e293b] text-slate-400 border border-slate-700 hover:border-slate-600"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Inbox className="h-10 w-10 mb-3 text-slate-600" />
          <p className="text-sm">Aucune équipe trouvée.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((equipe) => {
            const key = `${equipe.subject}:::${equipe.bet_type}`;
            const isExpanded = expandedIds.has(key);
            const betTypeLabel =
              BET_TYPES[equipe.bet_type as keyof typeof BET_TYPES] ??
              equipe.bet_type;

            const total = equipe.seriesCount;
            const wonPct = total > 0 ? (equipe.wonCount / total) * 100 : 0;
            const abandonedPct = total > 0 ? (equipe.abandonedCount / total) * 100 : 0;
            const enCoursPct = total > 0 ? (equipe.enCoursCount / total) * 100 : 0;

            return (
              <div key={key} className="rounded-xl bg-[#1e293b] overflow-hidden">
                <button
                  onClick={() => toggleExpand(key)}
                  className="w-full text-left p-3 space-y-2 hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  {/* Row 1: name + type + gain + chevron */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base font-bold text-slate-100 truncate">
                        {equipe.subject}
                      </span>
                      <Badge className="shrink-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                        {betTypeLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "font-bold text-sm",
                          equipe.netProfit >= 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {equipe.netProfit >= 0 ? "+" : ""}
                        {formatEuros(equipe.netProfit)}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Row 2: stats + ROI */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {equipe.seriesCount} série{equipe.seriesCount > 1 ? "s" : ""} · {equipe.betsCount} pari{equipe.betsCount > 1 ? "s" : ""}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        equipe.roi >= 0 ? "text-emerald-400/70" : "text-red-400/70"
                      )}
                    >
                      ROI {formatPercent(equipe.roi)}
                    </span>
                  </div>

                  {/* Row 3: progress bar */}
                  <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-slate-700/50">
                    {wonPct > 0 && (
                      <div className="bg-emerald-500" style={{ width: `${wonPct}%` }} />
                    )}
                    {abandonedPct > 0 && (
                      <div className="bg-red-500" style={{ width: `${abandonedPct}%` }} />
                    )}
                    {enCoursPct > 0 && (
                      <div className="bg-blue-500" style={{ width: `${enCoursPct}%` }} />
                    )}
                  </div>
                </button>

                {/* Expanded series */}
                {isExpanded && (
                  <div className="border-t border-slate-700/50 px-3 pb-3 pt-2 space-y-1.5">
                    {equipe.series.map((s, index) => (
                      <EquipeSeriesItem key={s.id} series={s} index={index + 1} />
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
