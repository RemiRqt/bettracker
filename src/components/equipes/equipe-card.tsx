"use client";

import { useId } from "react";
import { TeamLogo } from "@/components/ui/team-logo";
import { RollingNumber } from "@/components/ui/rolling-number";
import type { EquipeSeries } from "@/components/series/equipes-list";
import { BET_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ActiveSeriesBanner, EquipeStatsRow, EquipeProgressBar, PendingBetBlock, EquipeSeriesPanel } from "./equipe-card-parts";

export interface MergedEquipe {
  equipeId: string;
  name: string;
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
  activeSeries: {
    id: string;
    target_gain: number;
    betCount: number;
    sumStakes: number;
    hasPendingBet: boolean;
  } | null;
}

interface EquipeCardProps {
  eq: MergedEquipe;
  logoMap: Record<string, string>;
  nextFixture?: { date: string };
  isExpanded: boolean;
  showAllSeries: boolean;
  onToggleExpand: () => void;
  onToggleShowAllSeries: () => void;
  onEdit: () => void;
  onOpenBet: () => void;
  onValidate: (betId: string, result: "gagne" | "perdu") => void;
  onDeleteEmpty: () => void;
}

export function EquipeCard({
  eq,
  logoMap,
  nextFixture,
  isExpanded,
  showAllSeries,
  onToggleExpand,
  onToggleShowAllSeries,
  onEdit,
  onOpenBet,
  onValidate,
  onDeleteEmpty,
}: EquipeCardProps) {
  const panelId = useId();
  const betTypeLabel = BET_TYPES[eq.bet_type as keyof typeof BET_TYPES] ?? eq.bet_type;

  const canBetFromBanner = !!(eq.activeSeries && !eq.activeSeries.hasPendingBet);
  const activeId = eq.activeSeries?.id;
  const activeSeriesFull = activeId ? eq.series.find((s) => s.id === activeId) : null;
  const pendingBet = activeSeriesFull?.bets.find((b) => b.result === null) ?? null;

  return (
    <div className={cn("overflow-hidden rounded-xl bg-card", eq.activeSeries && "border border-primary/30")}>
      {eq.activeSeries && <ActiveSeriesBanner nextFixture={nextFixture} canBet={canBetFromBanner} onOpenBet={onOpenBet} />}

      {/* Card header */}
      <div className="space-y-2 p-3">
        {/* Row 1: logo (edit) + name+type (expand) + profit (expand) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={onEdit} aria-label={`Modifier l'équipe ${eq.name}`} className="shrink-0 transition-transform active:scale-95">
              <TeamLogo logoUrl={logoMap[eq.name]} sport={eq.sport} size="sm" />
            </button>
            <button
              type="button"
              onClick={onToggleExpand}
              aria-expanded={isExpanded}
              aria-controls={panelId}
              className="flex min-w-0 items-center gap-2 text-left"
            >
              <span className="truncate text-base font-bold text-foreground">{eq.name}</span>
              <Badge className="shrink-0 border-primary/30 bg-primary/20 px-1.5 py-0 text-2xs text-primary">{betTypeLabel}</Badge>
            </button>
          </div>
          <button type="button" onClick={onToggleExpand} aria-expanded={isExpanded} aria-controls={panelId} className="flex shrink-0 items-center gap-2">
            <span className={cn("text-sm font-bold", eq.netProfit >= 0 ? "text-primary" : "text-destructive")}>
              {eq.netProfit >= 0 ? "+" : ""}
              <RollingNumber value={eq.netProfit} format="euros" />
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
          </button>
        </div>

        <EquipeStatsRow eq={eq} onDeleteEmpty={onDeleteEmpty} />
        <EquipeProgressBar eq={eq} />
        {pendingBet && <PendingBetBlock bet={pendingBet} onValidate={onValidate} />}
      </div>

      {isExpanded && (
        <EquipeSeriesPanel id={panelId} eq={eq} showAllSeries={showAllSeries} onToggleShowAllSeries={onToggleShowAllSeries} onOpenBet={onOpenBet} />
      )}
    </div>
  );
}
