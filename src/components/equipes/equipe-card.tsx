"use client";

import { TeamLogo } from "@/components/ui/team-logo";
import { RollingNumber } from "@/components/ui/rolling-number";
import { EquipeSeriesItem } from "@/components/series/equipe-series-item";
import type { EquipeSeries } from "@/components/series/equipes-list";
import { BET_TYPES } from "@/lib/constants";
import { formatEuros, formatPercent, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  CalendarClock,
  CheckCircle,
  XCircle,
} from "lucide-react";

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

export function formatFixtureDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month} a ${hours}h${minutes}`;
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
  const betTypeLabel = BET_TYPES[eq.bet_type as keyof typeof BET_TYPES] ?? eq.bet_type;

  const barTotal = eq.totalWonAmount + eq.totalLostStake + eq.potentialGains;
  const wonPct = barTotal > 0 ? (eq.totalWonAmount / barTotal) * 100 : 0;
  const lostPct = barTotal > 0 ? (eq.totalLostStake / barTotal) * 100 : 0;
  const pendingPct = barTotal > 0 ? (eq.potentialGains / barTotal) * 100 : 0;

  const showBanner = !!eq.activeSeries;
  const canBetFromBanner = !!(eq.activeSeries && !eq.activeSeries.hasPendingBet);
  const activeSeriesFull = eq.activeSeries
    ? eq.series.find((s) => s.id === eq.activeSeries!.id)
    : null;
  const pendingBet = activeSeriesFull?.bets.find((b) => b.result === null) ?? null;

  return (
    <div
      className={cn(
        "rounded-xl bg-card overflow-hidden",
        eq.activeSeries && "border border-primary/30"
      )}
    >
      {/* Bandeau série en cours (+ prochain match si dispo) */}
      {showBanner && (
        <div className="flex items-center justify-between px-3 py-2 bg-info/10 border-b border-info/20">
          <div className="flex items-center gap-1.5 text-xs text-info">
            <CalendarClock className="h-3.5 w-3.5" />
            <span className="font-medium">
              {nextFixture
                ? `Prochain match : ${formatFixtureDateTime(nextFixture.date)}`
                : "Série en cours"}
            </span>
          </div>
          {canBetFromBanner && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenBet(); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors"
            >
              <Plus className="h-3 w-3" />
              Ajouter pari
            </button>
          )}
        </div>
      )}

      {/* Card header */}
      <div className="p-3 space-y-2">
        {/* Row 1: logo (edit) + name+type (expand) + profit (expand) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onEdit}
              aria-label="Modifier l'équipe"
              className="shrink-0 transition-transform active:scale-95"
            >
              <TeamLogo logoUrl={logoMap[eq.name]} sport={eq.sport} size="sm" />
            </button>
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-2 min-w-0 text-left"
            >
              <span className="text-base font-bold text-foreground truncate">{eq.name}</span>
              <Badge className="shrink-0 bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                {betTypeLabel}
              </Badge>
            </button>
          </div>
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-2 shrink-0"
          >
            <span className={cn("font-bold text-sm", eq.netProfit >= 0 ? "text-primary" : "text-destructive")}>
              {eq.netProfit >= 0 ? "+" : ""}
              <RollingNumber value={eq.netProfit} format="euros" />
            </span>
            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>

        {/* Row 2: stats + ROI or empty alert */}
        {eq.seriesCount === 0 ? (
          <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-warning/10 border border-warning/20">
            <span className="text-xs text-warning">Pas de série créée</span>
            <button
              onClick={onDeleteEmpty}
              className="text-xs text-destructive hover:text-destructive/80 cursor-pointer"
            >
              Supprimer
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {eq.seriesCount} serie{eq.seriesCount > 1 ? "s" : ""} · {eq.betsCount} pari{eq.betsCount > 1 ? "s" : ""}
              {eq.activeSeries && (
                <span className="text-info ml-2">
                  <TrendingUp className="h-3 w-3 inline" /> en cours (#{eq.activeSeries.betCount})
                </span>
              )}
            </span>
            <span className={cn("text-xs font-medium", eq.roi >= 0 ? "text-primary/70" : "text-destructive/70")}>
              ROI {formatPercent(eq.roi)}
            </span>
          </div>
        )}

        {/* Row 3: progress bar */}
        {barTotal > 0 && (
          <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-muted/50">
            {wonPct > 0 && <div className="bg-primary" style={{ width: `${wonPct}%` }} />}
            {lostPct > 0 && <div className="bg-destructive" style={{ width: `${lostPct}%` }} />}
            {pendingPct > 0 && <div className="bg-info" style={{ width: `${pendingPct}%` }} />}
          </div>
        )}

        {/* Pari en cours (sous la barre de progression) */}
        {pendingBet && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-info/10 border border-info/20 p-2">
            <div className="flex items-center gap-2 min-w-0 text-xs text-secondary-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-info/20 text-info text-[11px] font-bold">
                {pendingBet.bet_number}
              </span>
              <span>Cote {pendingBet.odds.toFixed(2)}</span>
              <span className="text-muted-foreground">· {formatEuros(pendingBet.stake)}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onValidate(pendingBet.id, "gagne"); }}
                className="flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/25 transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Gagné
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onValidate(pendingBet.id, "perdu"); }}
                className="flex items-center gap-1 rounded-lg bg-destructive/15 px-2 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/25 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" /> Perdu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expanded: nouvelle série (top) + séries (récente + voir plus) */}
      {isExpanded && (
        <div className="border-t border-border/50 px-3 pb-3 pt-2 space-y-1.5">
          {!eq.activeSeries && (
            <button
              onClick={onOpenBet}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Nouvelle serie
            </button>
          )}

          {(() => {
            const ordered = [...eq.series].sort((a, b) =>
              b.created_at.localeCompare(a.created_at)
            );
            const visible = showAllSeries ? ordered : ordered.slice(0, 1);
            return (
              <>
                {visible.map((s) => (
                  <div key={s.id}>
                    <EquipeSeriesItem series={s} />
                    {s.status === "en_cours" && !eq.activeSeries?.hasPendingBet && (
                      <button
                        onClick={onOpenBet}
                        className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Parier
                      </button>
                    )}
                  </div>
                ))}
                {ordered.length > 1 && (
                  <button
                    onClick={onToggleShowAllSeries}
                    className="w-full py-1 text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showAllSeries ? "Voir moins" : `Voir plus (${ordered.length - 1})`}
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
