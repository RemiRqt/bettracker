"use client";

import { Plus, CalendarClock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { EquipeSeriesItem } from "@/components/series/equipe-series-item";
import type { EquipeSeries } from "@/components/series/equipes-list";
import { SuggestedResultBadge } from "@/components/bets/suggested-result-badge";
import { formatEuros, formatPercent, cn } from "@/lib/utils";
import type { MergedEquipe } from "./equipe-card";

type PendingBet = EquipeSeries["bets"][number];
type Validate = (betId: string, result: "gagne" | "perdu") => void;

export function formatFixtureDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month} a ${hours}h${minutes}`;
}

// Bandeau « série en cours » (+ prochain match si dispo), avec « Ajouter pari ».
export function ActiveSeriesBanner({ nextFixture, canBet, onOpenBet }: { nextFixture?: { date: string }; canBet: boolean; onOpenBet: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-info/20 bg-info/10 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-info">
        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="font-medium">{nextFixture ? `Prochain match : ${formatFixtureDateTime(nextFixture.date)}` : "Série en cours"}</span>
      </div>
      {canBet && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenBet();
          }}
          className="relative flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-colors before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[''] hover:bg-primary/90"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          Ajouter pari
        </button>
      )}
    </div>
  );
}

// Ligne 2 de la carte : stats + ROI, ou alerte « Pas de série créée » avec suppression.
export function EquipeStatsRow({ eq, onDeleteEmpty }: { eq: MergedEquipe; onDeleteEmpty: () => void }) {
  if (eq.seriesCount === 0) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/10 px-2 py-1">
        <span className="text-xs text-warning">Pas de série créée</span>
        <button
          type="button"
          onClick={onDeleteEmpty}
          aria-label={`Supprimer l'équipe ${eq.name}`}
          className="cursor-pointer text-xs text-destructive hover:text-destructive/80"
        >
          Supprimer
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">
        {eq.seriesCount} serie{eq.seriesCount > 1 ? "s" : ""} · {eq.betsCount} pari{eq.betsCount > 1 ? "s" : ""}
        {eq.activeSeries && (
          <span className="ml-2 text-info">
            <TrendingUp className="inline h-3 w-3" aria-hidden="true" /> en cours (#{eq.activeSeries.betCount})
          </span>
        )}
      </span>
      <span className={cn("text-xs font-medium", eq.roi >= 0 ? "text-primary/70" : "text-destructive/70")}>ROI {formatPercent(eq.roi)}</span>
    </div>
  );
}

// Barre gagné / perdu / en attente.
export function EquipeProgressBar({ eq }: { eq: MergedEquipe }) {
  const barTotal = eq.totalWonAmount + eq.totalLostStake + eq.potentialGains;
  if (barTotal <= 0) return null;
  const wonPct = (eq.totalWonAmount / barTotal) * 100;
  const lostPct = (eq.totalLostStake / barTotal) * 100;
  const pendingPct = (eq.potentialGains / barTotal) * 100;
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
      {wonPct > 0 && <div className="bg-primary" style={{ width: `${wonPct}%` }} />}
      {lostPct > 0 && <div className="bg-destructive" style={{ width: `${lostPct}%` }} />}
      {pendingPct > 0 && <div className="bg-info" style={{ width: `${pendingPct}%` }} />}
    </div>
  );
}

// Pari en attente de la série active : suggestion auto + boutons Gagné / Perdu.
export function PendingBetBlock({ bet, onValidate }: { bet: PendingBet; onValidate: Validate }) {
  return (
    <>
      <SuggestedResultBadge bet={bet} onConfirm={(r) => onValidate(bet.id, r)} />
      <div className="flex items-center justify-between gap-2 rounded-lg border border-info/20 bg-info/10 p-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-secondary-foreground">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-info/20 text-2xs font-bold text-info">{bet.bet_number}</span>
          <span>Cote {bet.odds.toFixed(2)}</span>
          <span className="text-muted-foreground">· {formatEuros(bet.stake)}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onValidate(bet.id, "gagne");
            }}
            className="relative flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-1 text-2xs font-semibold text-primary transition-colors before:absolute before:inset-x-0 before:-inset-y-2.5 hover:bg-primary/25"
          >
            <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" /> Gagné
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onValidate(bet.id, "perdu");
            }}
            className="relative flex items-center gap-1 rounded-lg bg-destructive/15 px-2 py-1 text-2xs font-semibold text-destructive transition-colors before:absolute before:inset-x-0 before:-inset-y-2.5 hover:bg-destructive/25"
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Perdu
          </button>
        </div>
      </div>
    </>
  );
}

// Panneau déplié : nouvelle série (si aucune active) + séries (la plus récente + « Voir plus »).
export function EquipeSeriesPanel({
  id,
  eq,
  showAllSeries,
  onToggleShowAllSeries,
  onOpenBet,
}: {
  id: string;
  eq: MergedEquipe;
  showAllSeries: boolean;
  onToggleShowAllSeries: () => void;
  onOpenBet: () => void;
}) {
  const ordered = [...eq.series].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const visible = showAllSeries ? ordered : ordered.slice(0, 1);
  return (
    <div id={id} className="space-y-1.5 border-t border-border/50 px-3 pt-2 pb-3">
      {!eq.activeSeries && (
        <button
          type="button"
          onClick={onOpenBet}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Nouvelle serie
        </button>
      )}
      {visible.map((s) => (
        <div key={s.id}>
          <EquipeSeriesItem series={s} />
          {s.status === "en_cours" && !eq.activeSeries?.hasPendingBet && (
            <button
              type="button"
              onClick={onOpenBet}
              className="mt-1.5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Parier
            </button>
          )}
        </div>
      ))}
      {ordered.length > 1 && (
        <button
          type="button"
          onClick={onToggleShowAllSeries}
          className="min-h-11 w-full py-1 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {showAllSeries ? "Voir moins" : `Voir plus (${ordered.length - 1})`}
        </button>
      )}
    </div>
  );
}
