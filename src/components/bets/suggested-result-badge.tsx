"use client";

import { Sparkles, CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BetSuggestion } from "@/lib/types";

export type { BetSuggestion };

interface SuggestedResultBadgeProps {
  bet: BetSuggestion;
  onConfirm: (result: "gagne" | "perdu") => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Résultat proposé par le cron (score football-data). « Confirmer » valide la
 * suggestion ; les boutons Gagné/Perdu habituels restent là pour corriger.
 */
export function SuggestedResultBadge({ bet, onConfirm, disabled, className }: SuggestedResultBadgeProps) {
  const status = bet.resolution_status;
  if (status === "postponed" || status === "expired") {
    return (
      <div className={cn("flex items-center gap-1.5 text-[11px] text-muted-foreground", className)}>
        <CalendarX className="h-3.5 w-3.5" />
        {status === "postponed" ? "Match reporté — à valider à la main" : "Résultat introuvable — à valider à la main"}
      </div>
    );
  }
  if (status !== "suggested") return null;

  const suggested = bet.suggested_result === "gagne" || bet.suggested_result === "perdu" ? bet.suggested_result : null;
  const score = bet.fixture_score ?? "";

  if (!suggested) {
    return (
      <div className={cn("flex items-center gap-1.5 text-[11px] text-info", className)}>
        <Sparkles className="h-3.5 w-3.5" /> Terminé {score}
      </div>
    );
  }

  const win = suggested === "gagne";
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5",
        win ? "border-primary/30 bg-primary/10" : "border-destructive/30 bg-destructive/10",
        className,
      )}
    >
      <span className={cn("flex items-center gap-1.5 text-xs font-medium", win ? "text-primary" : "text-destructive")}>
        <Sparkles className="h-3.5 w-3.5" />
        {score} · {win ? "Gagné" : "Perdu"} ?
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onConfirm(suggested);
        }}
        className={cn(
          "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50",
          win
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        )}
      >
        Confirmer
      </button>
    </div>
  );
}
