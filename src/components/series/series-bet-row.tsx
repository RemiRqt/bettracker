"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { SuggestedResultBadge } from "@/components/bets/suggested-result-badge";
import { Badge } from "@/components/ui/badge";
import { formatEuros, cn } from "@/lib/utils";
import type { EquipeSeries } from "@/components/series/equipes-list";

type Bet = EquipeSeries["bets"][number];

const RESULTATS = {
  gagne: { label: "Gagné", className: "bg-primary/20 text-primary border-primary/30" },
  perdu: { label: "Perdu", className: "bg-destructive/20 text-destructive border-destructive/30" },
  attente: { label: "En attente", className: "bg-muted/20 text-muted-foreground border-border/30" },
} as const;

interface SeriesBetRowProps {
  bet: Bet;
  disabled: boolean;
  onValidate: (betId: string, result: "gagne" | "perdu") => void;
}

// Une ligne de pari dans une série dépliée : n°, date, cote, mise, puis résultat
// (badge) ou boutons Gagné / Perdu tant que le pari est en attente.
export function SeriesBetRow({ bet, disabled, onValidate }: SeriesBetRowProps) {
  const dateStr = new Date(bet.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  const resultat =
    bet.result === "gagne" ? RESULTATS.gagne : bet.result === "perdu" ? RESULTATS.perdu : RESULTATS.attente;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-card/60 p-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
        {bet.bet_number}
      </div>

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
        {bet.result === null && (
          <SuggestedResultBadge
            bet={bet}
            disabled={disabled}
            onConfirm={(r) => onValidate(bet.id, r)}
            className="mt-1.5"
          />
        )}
      </div>

      {bet.result === null ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onValidate(bet.id, "gagne")}
            disabled={disabled}
            className="relative flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-1 before:absolute before:-inset-y-2.5 before:inset-x-0 text-[11px] font-semibold text-primary hover:bg-primary/25 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" /> Gagné
          </button>
          <button
            type="button"
            onClick={() => onValidate(bet.id, "perdu")}
            disabled={disabled}
            className="relative flex items-center gap-1 rounded-lg bg-destructive/15 px-2 py-1 before:absolute before:-inset-y-2.5 before:inset-x-0 text-[11px] font-semibold text-destructive hover:bg-destructive/25 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Perdu
          </button>
        </div>
      ) : (
        <Badge className={cn("shrink-0 text-[10px] px-1.5 py-0", resultat.className)}>{resultat.label}</Badge>
      )}
    </div>
  );
}
