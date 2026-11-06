"use client";

import { CheckCircle, XCircle, Trash2, Pencil } from "lucide-react";
import { SuggestedResultBadge } from "@/components/bets/suggested-result-badge";
import { BET_TYPES, SPORT_EMOJIS } from "@/lib/constants";
import { formatEuros, cn } from "@/lib/utils";
import { TeamLogo } from "@/components/ui/team-logo";
import type { Bet } from "./paris-types";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

interface BetCardProps {
  bet: Bet;
  logoUrl?: string;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onWin: () => void;
  onLose: () => void;
}

function BetCardInfos({ bet, logoUrl }: { bet: Bet; logoUrl?: string }) {
  const typeLabel = BET_TYPES[bet.series.bet_type as keyof typeof BET_TYPES] ?? bet.series.bet_type;
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <TeamLogo logoUrl={logoUrl} size="sm" className="flex-shrink-0" />
        <span className="font-semibold text-foreground text-sm truncate">{bet.series.subject}</span>
        <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-2xs font-medium bg-muted text-secondary-foreground">
          {typeLabel}
        </span>
        {bet.series.kind === "unique" && (
          <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-2xs font-medium bg-primary/15 text-primary">
            Unique
          </span>
        )}
        {bet.series.sport && bet.series.sport !== "football" && (
          <span className="flex-shrink-0 text-xs" role="img" aria-label={bet.series.sport} title={bet.series.sport}>
            {SPORT_EMOJIS[bet.series.sport] ?? SPORT_EMOJIS.default}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-muted-foreground">{formatDate(bet.created_at)}</span>
        <span className="text-xs text-muted-foreground">Pari #{bet.bet_number}</span>
      </div>
    </div>
  );
}

// Carte d'un pari : sujet, montants, actions (modifier / supprimer), validation Gagné / Perdu.
export function BetCard({ bet, logoUrl, disabled, onEdit, onDelete, onWin, onLose }: BetCardProps) {
  const pending = bet.result === null;
  return (
    <div className={cn("bg-card rounded-xl p-3 border", pending ? "border-info/20" : "border-transparent")}>
      <div className="flex items-center justify-between gap-3">
        <BetCardInfos bet={bet} logoUrl={logoUrl} />

        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              <span className="text-foreground">{formatEuros(bet.stake)}</span>
            </span>
            <span>
              ×<span className="text-foreground ml-0.5">{bet.odds.toFixed(2)}</span>
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            {!pending && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  bet.result === "gagne" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                )}
              >
                {bet.result === "gagne" ? "Gagne" : "Perdu"}
              </span>
            )}
            <button
              type="button"
              onClick={onEdit}
              disabled={disabled}
              aria-label={`Modifier le pari #${bet.bet_number} sur ${bet.series.subject}`}
              className="inline-flex size-11 -my-3.5 -mx-2 items-center justify-center text-muted-foreground hover:text-muted-foreground/80 transition-colors disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={disabled}
              aria-label={`Supprimer le pari #${bet.bet_number} sur ${bet.series.subject}`}
              className="inline-flex size-11 -my-3.5 -mx-2 items-center justify-center text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {pending && (
        <SuggestedResultBadge
          bet={bet}
          disabled={disabled}
          onConfirm={(r) => (r === "gagne" ? onWin() : onLose())}
          className="mt-2"
        />
      )}

      {/* En attente : Gagné / Perdu sous la carte */}
      {pending && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onWin}
            disabled={disabled}
            className="relative before:absolute before:-inset-y-1 before:inset-x-0 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary/15 text-primary text-sm font-semibold hover:bg-primary/25 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" aria-hidden="true" /> Gagné
          </button>
          <button
            type="button"
            onClick={onLose}
            disabled={disabled}
            className="relative before:absolute before:-inset-y-1 before:inset-x-0 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-destructive/15 text-destructive text-sm font-semibold hover:bg-destructive/25 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" /> Perdu
          </button>
        </div>
      )}
    </div>
  );
}
