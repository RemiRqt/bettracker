"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronRight, ChevronUp, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BET_TYPES } from "@/lib/constants";
import { formatEuros, formatPercent, cn } from "@/lib/utils";
import { EquipeSeriesItem } from "@/components/series/equipe-series-item";
import { TeamLogo } from "@/components/ui/team-logo";

export type EquipeSeries = {
  id: string;
  seriesNumber: number;
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
  sport: string;
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
  totalWonAmount: number;
  totalLostStake: number;
  potentialGains: number;
};

type SortKey = "date" | "gains" | "paris";
type FilterKey = "en_cours" | "gagne" | "perdu" | "pause" | null;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Récent" },
  { key: "gains", label: "Gains" },
  { key: "paris", label: "Paris" },
];

const FILTER_OPTIONS: { key: "en_cours" | "gagne" | "perdu" | "pause"; label: string; color: string; activeColor: string }[] = [
  { key: "en_cours", label: "En cours", color: "text-info border-info/30", activeColor: "bg-info/20" },
  { key: "gagne", label: "Gagné", color: "text-primary border-primary/30", activeColor: "bg-primary/20" },
  { key: "perdu", label: "Perdu", color: "text-destructive border-destructive/30", activeColor: "bg-destructive/20" },
  { key: "pause", label: "En pause", color: "text-warning border-warning/30", activeColor: "bg-warning/20" },
];

interface EquipesListProps {
  equipes: Equipe[];
  logoMap?: Record<string, string>;
}

export function EquipesList({ equipes, logoMap = {} }: EquipesListProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterBy, setFilterBy] = useState<FilterKey>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  }

  const counts = useMemo(() => {
    const c = { en_cours: 0, gagne: 0, perdu: 0, pause: 0 };
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
    if (filterBy === null) return true;
    switch (filterBy) {
      case "en_cours":
        return eq.enCoursCount > 0;
      case "gagne":
        return eq.netProfit > 0;
      case "perdu":
        return eq.netProfit < 0;
      case "pause":
        return eq.lastSeriesStatus === "abandonnee" && eq.enCoursCount === 0;
    }
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "date":
        cmp = b.lastBetDate.localeCompare(a.lastBetDate);
        break;
      case "gains":
        cmp = b.netProfit - a.netProfit;
        break;
      case "paris":
        cmp = b.betsCount - a.betsCount;
        break;
    }
    return sortAsc ? -cmp : cmp;
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-sm text-secondary-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>

      {/* Filter tabs - toggleable */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filterBy === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setFilterBy(isActive ? null : opt.key)}
              className={cn(
                "flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border",
                isActive
                  ? `${opt.activeColor} ${opt.color}`
                  : "bg-transparent text-muted-foreground border-border/50 hover:border-border"
              )}
            >
              {opt.label}
              <span className="ml-1 opacity-60">{counts[opt.key]}</span>
            </button>
          );
        })}
      </div>

      {/* Sort buttons - 1/3 each */}
      <div className="grid grid-cols-3 gap-1.5">
        {SORT_OPTIONS.map((opt) => {
          const isActive = sortBy === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => handleSort(opt.key)}
              className={cn(
                "flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                isActive
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border hover:border-border"
              )}
            >
              {opt.label}
              {isActive && (
                sortAsc
                  ? <ChevronUp className="h-3 w-3" />
                  : <ChevronDown className="h-3 w-3" />
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="h-10 w-10 mb-3 text-muted-foreground" />
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

            const barTotal = equipe.totalWonAmount + equipe.totalLostStake + equipe.potentialGains;
            const wonPct = barTotal > 0 ? (equipe.totalWonAmount / barTotal) * 100 : 0;
            const lostPct = barTotal > 0 ? (equipe.totalLostStake / barTotal) * 100 : 0;
            const pendingPct = barTotal > 0 ? (equipe.potentialGains / barTotal) * 100 : 0;

            return (
              <div key={key} className="rounded-xl bg-card overflow-hidden">
                <button
                  onClick={() => toggleExpand(key)}
                  className="w-full text-left p-3 space-y-2 hover:bg-foreground/[0.02] transition-colors cursor-pointer"
                >
                  {/* Row 1: logo + name + type + gain + chevron */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamLogo logoUrl={logoMap[equipe.subject]} sport={equipe.sport} size="sm" className="flex-shrink-0" />
                      <span className="text-base font-bold text-foreground truncate">
                        {equipe.subject}
                      </span>
                      <Badge className="shrink-0 bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                        {betTypeLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "font-bold text-sm",
                          equipe.netProfit >= 0 ? "text-primary" : "text-destructive"
                        )}
                      >
                        {equipe.netProfit >= 0 ? "+" : ""}
                        {formatEuros(equipe.netProfit)}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Row 2: stats + ROI */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {equipe.seriesCount} série{equipe.seriesCount > 1 ? "s" : ""} · {equipe.betsCount} pari{equipe.betsCount > 1 ? "s" : ""}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        equipe.roi >= 0 ? "text-primary/70" : "text-destructive/70"
                      )}
                    >
                      ROI {formatPercent(equipe.roi)}
                    </span>
                  </div>

                  {/* Row 3: progress bar (€ proportions) */}
                  <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-muted/50">
                    {wonPct > 0 && (
                      <div className="bg-primary" style={{ width: `${wonPct}%` }} />
                    )}
                    {lostPct > 0 && (
                      <div className="bg-destructive" style={{ width: `${lostPct}%` }} />
                    )}
                    {pendingPct > 0 && (
                      <div className="bg-info" style={{ width: `${pendingPct}%` }} />
                    )}
                  </div>
                </button>

                {/* Expanded series */}
                {isExpanded && (
                  <div className="border-t border-border/50 px-3 pb-3 pt-2 space-y-1.5">
                    {equipe.series.map((s) => (
                      <EquipeSeriesItem key={s.id} series={s} />
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
