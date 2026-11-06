"use client";

import { useId, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Ban,
  RotateCcw,
} from "lucide-react";
import { SeriesStatusBadge } from "@/components/series/series-status-badge";
import { formatEuros, formatPercent, cn } from "@/lib/utils";
import { deleteSeries, abandonSeries, reopenSeries } from "@/actions/series";
import { validateResult } from "@/actions/bets";
import { fireConfetti } from "@/lib/confetti";
import { canDeleteSeries } from "@/lib/series-utils";
import { SeriesBetRow } from "@/components/series/series-bet-row";
import {
  SeriesItemDialogs,
  type DialogueSerie,
} from "@/components/series/series-item-dialogs";
import { useToast } from "@/hooks/use-toast";
import type { EquipeSeries } from "@/components/series/equipes-list";
import type { SeriesStatus } from "@/lib/types";

interface EquipeSeriesItemProps {
  series: EquipeSeries;
}

export function EquipeSeriesItem({ series }: EquipeSeriesItemProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const [deleted, setDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dialogue, setDialogue] = useState<DialogueSerie>(null);
  const { toast } = useToast();

  const isDeletable = canDeleteSeries(series.status, series.bets);
  const canAbandon = series.status === "en_cours";

  function runAction(
    action: () => Promise<{ error?: string } | void | undefined>,
    onError?: () => void,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        onError?.();
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  function handleDelete() {
    setDeleted(true);
    runAction(
      () => deleteSeries(series.id),
      () => setDeleted(false),
    );
  }

  function handleValidate(betId: string, result: "gagne" | "perdu") {
    startTransition(async () => {
      const res = await validateResult(betId, result);
      if (result === "gagne" && !res?.error) fireConfetti();
    });
  }

  const dialogs = (
    <SeriesItemDialogs
      seriesNumber={series.seriesNumber}
      dialogue={dialogue}
      fermer={() => setDialogue(null)}
      surSupprimer={handleDelete}
      surAbandonner={() => runAction(() => abandonSeries(series.id))}
      surRouvrir={() => runAction(() => reopenSeries(series.id))}
    />
  );

  // Arbre stable : la popup reste au même endroit quand la série disparaît (fermeture animée).
  return (
    <>
      {!deleted && (
        <div className="rounded-lg bg-background/60 overflow-hidden">
          {/* En-tête : le bouton dépliant couvre toute la zone (after:inset-0), les actions sont à côté */}
          <div className="relative p-3 space-y-1.5 hover:bg-foreground/[0.02] transition-colors">
            {/* Row 1: Série #N + status badge + gains + chevron */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                aria-controls={panelId}
                className="flex items-center gap-2 text-left after:absolute after:inset-0"
              >
                <span className="text-sm font-semibold text-secondary-foreground">
                  Série #{series.seriesNumber}
                </span>
                <SeriesStatusBadge status={series.status as SeriesStatus} />
                <span
                  className={cn(
                    "text-sm font-bold",
                    series.netProfit >= 0 ? "text-primary" : "text-destructive",
                  )}
                >
                  {series.netProfit >= 0 ? "+" : ""}
                  {formatEuros(series.netProfit)}
                </span>
              </button>
              <div className="flex items-center shrink-0">
                {canAbandon && (
                  <button
                    type="button"
                    onClick={() => setDialogue("abandonner")}
                    aria-label={`Abandonner la série #${series.seriesNumber}`}
                    className="relative z-10 inline-flex size-11 -my-3 items-center justify-center text-muted-foreground hover:text-warning transition-colors"
                  >
                    <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
                {isDeletable && (
                  <button
                    type="button"
                    onClick={() => setDialogue("supprimer")}
                    aria-label={`Supprimer la série #${series.seriesNumber}`}
                    className="relative z-10 inline-flex size-11 -my-3 items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
                {expanded ? (
                  <ChevronDown
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronRight
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>

            {/* Row 2: stats */}
            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>
                {series.bets.length} pari{series.bets.length > 1 ? "s" : ""}
              </span>
              <span aria-hidden="true">&middot;</span>
              <span>Mise : {formatEuros(series.totalStake)}</span>
              <span aria-hidden="true">&middot;</span>
              <span
                className={cn(
                  "font-medium",
                  series.roi >= 0 ? "text-primary" : "text-destructive",
                )}
              >
                ROI : {formatPercent(series.roi)}
              </span>
            </p>
          </div>

          {/* Expanded: individual bets */}
          {expanded && (
            <div
              id={panelId}
              className="border-t border-border/30 px-3 pb-3 pt-2 space-y-2"
            >
              {[...series.bets]
                .sort((a, b) => b.bet_number - a.bet_number)
                .map((bet) => (
                  <SeriesBetRow
                    key={bet.id}
                    bet={bet}
                    disabled={isPending}
                    onValidate={handleValidate}
                  />
                ))}

              {series.status === "abandonnee" && (
                <button
                  type="button"
                  onClick={() => setDialogue("rouvrir")}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-info/15 text-info text-sm font-medium hover:bg-info/25 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> Rouvrir
                  la série
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {dialogs}
    </>
  );
}
