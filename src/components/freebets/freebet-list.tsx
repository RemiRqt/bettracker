"use client";

import { useState } from "react";
import { deleteFreebet } from "@/actions/freebets";
import { formatEuros } from "@/lib/utils";
import type { Freebet } from "@/lib/types";
import { Ticket, Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface FreebetListProps {
  freebets: Freebet[];
}

// A freebet is considered fully used once almost nothing remains.
const USED_THRESHOLD = 0.01;

export function FreebetList({ freebets }: FreebetListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [showUsed, setShowUsed] = useState(false);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteFreebet(id);
    setDeletingId(null);
    setConfirmId(null);
  }

  const active = freebets.filter((fb) => fb.remaining_amount > USED_THRESHOLD);
  const used = freebets.filter((fb) => fb.remaining_amount <= USED_THRESHOLD);

  function DeleteControl({ id }: { id: string }) {
    if (confirmId === id) {
      return (
        <div className="flex gap-1">
          <button
            onClick={() => handleDelete(id)}
            disabled={deletingId === id}
            className="text-xs text-destructive hover:text-destructive cursor-pointer"
          >
            Oui
          </button>
          <button
            onClick={() => setConfirmId(null)}
            className="text-xs text-muted-foreground hover:text-secondary-foreground cursor-pointer"
          >
            Non
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => setConfirmId(id)}
        className="text-muted-foreground hover:text-destructive cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-secondary-foreground">Mes freebets</h2>

      {/* Active freebets — full card with progress bar */}
      {active.map((fb) => {
        const usedPercent =
          fb.initial_amount > 0
            ? ((fb.initial_amount - fb.remaining_amount) / fb.initial_amount) * 100
            : 0;

        return (
          <div
            key={fb.id}
            className="rounded-xl bg-card p-3 border border-warning/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-warning" />
                <span className="text-sm font-bold text-warning">
                  {formatEuros(fb.remaining_amount)}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {formatEuros(fb.initial_amount)}
                </span>
              </div>
              <DeleteControl id={fb.id} />
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-warning transition-all"
                style={{ width: `${Math.min(usedPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">
                {new Date(fb.created_at).toLocaleDateString("fr-FR")}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {Math.round(usedPercent)}% utilisé
              </span>
            </div>
          </div>
        );
      })}

      {active.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Ticket className="h-8 w-8 mb-2 text-muted-foreground" />
          <p className="text-xs">Aucun freebet disponible.</p>
        </div>
      )}

      {/* Used freebets — collapsible section, compact cards */}
      {used.length > 0 && (
        <div className="pt-1">
          <button
            onClick={() => setShowUsed((prev) => !prev)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-muted-foreground cursor-pointer"
          >
            {showUsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Utilisés ({used.length})
          </button>

          {showUsed && (
            <div className="mt-2 space-y-1.5">
              {used.map((fb) => (
                <div
                  key={fb.id}
                  className="flex items-center justify-between rounded-lg bg-card/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Ticket className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatEuros(fb.initial_amount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(fb.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <DeleteControl id={fb.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
