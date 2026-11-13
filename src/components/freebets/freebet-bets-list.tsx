"use client";

import { useState } from "react";
import { validateFreebetResult, deleteFreebetBet } from "@/actions/freebets";
import { formatEuros } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";
import type { FreebetBet } from "@/lib/types";
import { Ticket, CheckCircle, XCircle, Trash2 } from "lucide-react";

interface FreebetBetsListProps {
  bets: (FreebetBet & { freebet_source: string })[];
}

export function FreebetBetsList({ bets }: FreebetBetsListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleValidate(betId: string, result: "gagne" | "perdu") {
    setLoadingId(betId);
    await validateFreebetResult(betId, result);
    setLoadingId(null);
    if (result === "gagne") fireConfetti();
  }

  async function handleDelete(betId: string) {
    setLoadingId(betId);
    await deleteFreebetBet(betId);
    setLoadingId(null);
  }

  const pendingBets = bets.filter((b) => b.result === null);
  const settledBets = bets.filter((b) => b.result !== null);

  return (
    <div className="space-y-4">
      {pendingBets.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-secondary-foreground">Paris en attente</h2>
          {pendingBets.map((bet) => (
            <BetCard key={bet.id} bet={bet} loading={loadingId === bet.id} onValidate={handleValidate} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {settledBets.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-secondary-foreground">Historique</h2>
          {settledBets.map((bet) => (
            <BetCard key={bet.id} bet={bet} loading={false} />
          ))}
        </div>
      )}
    </div>
  );
}

function BetCard({
  bet,
  loading,
  onValidate,
  onDelete,
}: {
  bet: FreebetBet & { freebet_source: string };
  loading: boolean;
  onValidate?: (id: string, result: "gagne" | "perdu") => void;
  onDelete?: (id: string) => void;
}) {
  const profit = Math.round((bet.stake * bet.odds - bet.stake) * 100) / 100;
  const isPending = bet.result === null;
  const isWon = bet.result === "gagne";

  return (
    <div className="rounded-xl bg-card p-3">
      <div className="mb-2 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 flex-shrink-0 text-warning" />
            <span className="truncate text-sm font-medium text-secondary-foreground">{bet.subject}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Cote {bet.odds.toFixed(2)}</span>
            <span>·</span>
            <span>Mise {formatEuros(bet.stake)}</span>
          </div>
        </div>
        <div className="ml-2 text-right">
          {isPending ? (
            <span className="text-xs text-muted-foreground">+{formatEuros(profit)} potentiel</span>
          ) : isWon ? (
            <span className="text-sm font-bold text-primary">+{formatEuros(profit)}</span>
          ) : (
            <span className="text-sm font-bold text-muted-foreground">0,00 €</span>
          )}
        </div>
      </div>

      {!isPending && (
        <div className="flex items-center gap-1.5">
          {isWon ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <CheckCircle className="h-3 w-3" /> Gagné
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              <XCircle className="h-3 w-3" /> Perdu
            </span>
          )}
          <span className="text-2xs text-muted-foreground">{new Date(bet.created_at).toLocaleDateString("fr-FR")}</span>
        </div>
      )}

      {isPending && onValidate && (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => onValidate(bet.id, "gagne")}
            disabled={loading}
            className="flex h-8 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg bg-primary/20 text-xs font-semibold text-primary hover:bg-primary/30"
          >
            <CheckCircle aria-hidden className="h-3.5 w-3.5" /> Gagné
          </button>
          <button
            onClick={() => onValidate(bet.id, "perdu")}
            disabled={loading}
            className="flex h-8 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg bg-destructive/20 text-xs font-semibold text-destructive hover:bg-destructive/30"
          >
            <XCircle aria-hidden className="h-3.5 w-3.5" /> Perdu
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(bet.id)}
              disabled={loading}
              aria-label="Supprimer ce pari"
              className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-muted/50 text-muted-foreground before:absolute before:-inset-1.5 before:content-[''] hover:text-destructive"
            >
              <Trash2 aria-hidden className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
