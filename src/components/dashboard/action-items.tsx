"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { TeamLogo } from "@/components/ui/team-logo";
import { useBetModal } from "@/components/paris/bet-modal-provider";
import { validateResult } from "@/actions/bets";
import { fireConfetti } from "@/lib/confetti";
import { BET_TYPES } from "@/lib/constants";
import { formatEuros } from "@/lib/utils";
import { CalendarClock, Plus, CheckCircle, XCircle } from "lucide-react";
import type { ActionItem } from "@/lib/types";

function formatFixtureDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month} à ${hours}h${minutes}`;
}

interface ActionCardProps {
  item: ActionItem;
  onBet: () => void;
  onValidate: (betId: string, result: "gagne" | "perdu") => void;
}

function ActionCard({ item, onBet, onValidate }: ActionCardProps) {
  const betTypeLabel =
    BET_TYPES[item.betType as keyof typeof BET_TYPES] ?? item.betType;
  const pending = item.pendingBet;

  return (
    <div className="overflow-hidden rounded-xl border border-primary/30 bg-card">
      {/* Banner: next match (or "série en cours" fallback) */}
      <div className="flex items-center gap-1.5 border-b border-info/20 bg-info/10 px-3 py-1.5 text-xs text-info">
        <CalendarClock className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate font-medium">
          {item.nextMatchDate
            ? `Prochain match : ${formatFixtureDateTime(item.nextMatchDate)}`
            : "Série en cours"}
        </span>
      </div>

      <div className="space-y-2 p-3">
        {/* Logo + name + bet type */}
        <div className="flex min-w-0 items-center gap-2">
          <TeamLogo logoUrl={item.logoUrl} sport={item.sport} size="sm" />
          <span className="truncate text-base font-bold text-foreground">
            {item.subject}
          </span>
          <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {betTypeLabel}
          </span>
        </div>

        {pending ? (
          /* Pari en cours: cote/mise + validation */
          <div className="flex items-center justify-between gap-2 rounded-lg border border-info/20 bg-info/10 p-2">
            <div className="flex min-w-0 items-center gap-2 text-xs text-secondary-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-info/20 text-[11px] font-bold text-info">
                {pending.betNumber}
              </span>
              <span>Cote {pending.odds.toFixed(2)}</span>
              <span className="text-muted-foreground">
                · {formatEuros(pending.stake)}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onValidate(pending.id, "gagne")}
                className="flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/25"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Gagné
              </button>
              <button
                type="button"
                onClick={() => onValidate(pending.id, "perdu")}
                className="flex items-center gap-1 rounded-lg bg-destructive/15 px-2 py-1 text-[11px] font-semibold text-destructive transition-colors hover:bg-destructive/25"
              >
                <XCircle className="h-3.5 w-3.5" /> Perdu
              </button>
            </div>
          </div>
        ) : (
          /* Pas de pari en cours: bouton Parier */
          <button
            type="button"
            onClick={onBet}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> Parier
          </button>
        )}
      </div>
    </div>
  );
}

export function ActionItems({ items }: { items: ActionItem[] }) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const { open: openBetModal } = useBetModal();

  if (items.length === 0) return null;

  function handleValidate(betId: string, result: "gagne" | "perdu") {
    startTransition(async () => {
      const res = await validateResult(betId, result);
      if (result === "gagne" && !res?.error) fireConfetti();
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          À suivre
        </span>
        <span className="text-[10px] text-muted-foreground">
          {items.length} en cours
        </span>
      </div>
      {items.map((item) => (
        <ActionCard
          key={item.seriesId}
          item={item}
          onBet={() =>
            openBetModal({
              subject: item.subject,
              betType: item.betType,
              sport: item.sport,
            })
          }
          onValidate={handleValidate}
        />
      ))}
    </div>
  );
}
