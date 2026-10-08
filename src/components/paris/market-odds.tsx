"use client";

import { Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { bookmakerLabel } from "@/lib/odds-api";
import type { MarketOddsState } from "./use-market-odds";

interface MarketOddsProps {
  state: MarketOddsState;
  /** Libellé de l'issue, ex. « PSG vainqueur ». */
  outcomeLabel: string;
  currentOdds: number;
  onPick: (price: number) => void;
}

function pct(n: number): string {
  const v = Math.round(n * 1000) / 10;
  return `${v > 0 ? "+" : ""}${v.toLocaleString("fr-FR")} %`;
}

/** Cotes du marché (bookmakers cochés du user) pour l'issue pariée. */
export function MarketOdds({ state, outcomeLabel, currentOdds, onPick }: MarketOddsProps) {
  if (state.status === "idle") return null;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-secondary-foreground">
        Cotes du marché · {outcomeLabel}
      </label>
      {state.status === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement des cotes…
        </div>
      )}
      {state.status === "unavailable" && (
        <p className="text-sm text-muted-foreground">Cotes indisponibles pour tes bookmakers</p>
      )}
      {state.status === "ready" && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(state.data.prices)
              .sort((a, b) => b[1] - a[1])
              .map(([key, price]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onPick(price)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    Math.abs(currentOdds - price) < 0.005
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-card border-border text-secondary-foreground",
                  )}
                >
                  {key === state.data.bestBookmaker && <Star className="h-3 w-3 fill-current" />}
                  {bookmakerLabel(key)} <span className="font-bold">{price.toFixed(2)}</span>
                </button>
              ))}
          </div>
          {currentOdds > 1 && (
            <p
              className={cn(
                "text-xs",
                currentOdds >= state.data.avg ? "text-primary" : "text-destructive",
              )}
            >
              Ta cote {currentOdds.toFixed(2)} · {pct(currentOdds / state.data.best - 1)} vs meilleure ·{" "}
              {pct(currentOdds / state.data.avg - 1)} vs moyenne
            </p>
          )}
        </>
      )}
    </div>
  );
}
