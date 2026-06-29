"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Trash2, Ban } from "lucide-react";
import { SeriesStatusBadge } from "@/components/series/series-status-badge";
import { Badge } from "@/components/ui/badge";
import { formatEuros, formatPercent, cn } from "@/lib/utils";
import { deleteSeries, abandonSeries } from "@/actions/series";
import { canDeleteSeries } from "@/lib/series-utils";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import type { EquipeSeries } from "@/components/series/equipes-list";
import type { SeriesStatus } from "@/lib/types";

interface EquipeSeriesItemProps {
  series: EquipeSeries;
}

export function EquipeSeriesItem({ series }: EquipeSeriesItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [, startTransition] = useTransition();
  const confirm = useConfirm();
  const { toast } = useToast();

  const isDeletable = canDeleteSeries(series.status, series.bets);
  const canAbandon = series.status === "en_cours";

  async function handleDelete() {
    const ok = await confirm({
      title: `Supprimer la série #${series.seriesNumber} ?`,
      description: "Cette action est irréversible.",
      confirmLabel: "Supprimer",
      variant: "destructive",
    });
    if (!ok) return;
    setDeleted(true);
    startTransition(async () => {
      const result = await deleteSeries(series.id);
      if (result?.error) {
        setDeleted(false);
        toast({ title: "Erreur", description: result.error, variant: "destructive" });
      }
    });
  }

  async function handleAbandon() {
    const ok = await confirm({
      title: `Abandonner la série #${series.seriesNumber} ?`,
      description: "Les paris en attente seront marqués comme perdus.",
      confirmLabel: "Abandonner",
      variant: "destructive",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await abandonSeries(series.id);
      if (result?.error) {
        toast({ title: "Erreur", description: result.error, variant: "destructive" });
      }
    });
  }

  if (deleted) return null;

  return (
    <div className="rounded-lg bg-background/60 overflow-hidden">
      {/* Series header - clickable */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left p-3 space-y-1.5 hover:bg-foreground/[0.02] transition-colors"
      >
        {/* Row 1: Série #N + status badge + gains + chevron */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-secondary-foreground">
              Série #{series.seriesNumber}
            </span>
            <SeriesStatusBadge status={series.status as SeriesStatus} />
            <span
              className={cn(
                "text-sm font-bold",
                series.netProfit >= 0 ? "text-primary" : "text-destructive"
              )}
            >
              {series.netProfit >= 0 ? "+" : ""}{formatEuros(series.netProfit)}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canAbandon && (
              <button
                onClick={(e) => { e.stopPropagation(); handleAbandon(); }}
                className="text-muted-foreground hover:text-warning transition-colors p-0.5"
                title="Abandonner la série"
              >
                <Ban className="h-3.5 w-3.5" />
              </button>
            )}
            {isDeletable && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                title="Supprimer la série"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Row 2: stats */}
        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span>
            {series.bets.length} pari{series.bets.length > 1 ? "s" : ""}
          </span>
          <span>&middot;</span>
          <span>Mise : {formatEuros(series.totalStake)}</span>
          <span>&middot;</span>
          <span
            className={cn(
              "font-medium",
              series.roi >= 0 ? "text-primary" : "text-destructive"
            )}
          >
            ROI : {formatPercent(series.roi)}
          </span>
        </p>
      </button>

      {/* Expanded: individual bets */}
      {expanded && (
        <div className="border-t border-border/30 px-3 pb-3 pt-2 space-y-2">
          {series.bets.map((bet) => {
            const date = new Date(bet.created_at);
            const dateStr = date.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            });

            let resultLabel: string;
            let resultClass: string;
            if (bet.result === "gagne") {
              resultLabel = "Gagné";
              resultClass = "bg-primary/20 text-primary border-primary/30";
            } else if (bet.result === "perdu") {
              resultLabel = "Perdu";
              resultClass = "bg-destructive/20 text-destructive border-destructive/30";
            } else {
              resultLabel = "En attente";
              resultClass = "bg-muted/20 text-muted-foreground border-border/30";
            }

            return (
              <div
                key={bet.id}
                className="flex items-center gap-3 rounded-lg bg-card/60 p-2.5"
              >
                {/* Bet number circle */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                  {bet.bet_number}
                </div>

                {/* Bet details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-secondary-foreground">
                    <span>{dateStr}</span>
                    <span>
                      Cote : <span className="font-medium">{bet.odds.toFixed(2)}</span>
                    </span>
                    <span>
                      Mise : <span className="font-medium">{formatEuros(bet.stake)}</span>
                    </span>
                  </div>
                </div>

                {/* Result badge */}
                <Badge
                  className={cn(
                    "shrink-0 text-[10px] px-1.5 py-0",
                    resultClass
                  )}
                >
                  {resultLabel}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
